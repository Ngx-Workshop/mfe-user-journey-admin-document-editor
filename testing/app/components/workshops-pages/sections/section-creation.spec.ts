import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SectionDto } from '@tmdjr/document-contracts';
import { Asset, provideAssetManager } from '@tmdjr/ngx-asset-manager';
import { firstValueFrom } from 'rxjs';
import { Routes } from '../../../../../src/app/app.routes';
import { NavigationService } from '../../../../../src/app/services/navigation.service';
import { CreateSectionComponent } from '../../../../../src/app/components/workshops-pages/sections/create-section.component';
import { SectionListComponent } from '../../../../../src/app/components/workshops-pages/sections/section-list.component';

describe('Section authoring', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let navigation: NavigationService;
  let router: Router;
  const section: SectionDto = {
    _id: '507f1f77bcf86cd799439011',
    sectionTitle: 'TypeScript',
    sectionDescription: 'Learn TypeScript.\nBuild typed workshops.',
    summary: 42.5,
    menuSvgPath: '/menu.svg',
    headerSvgPath: '/header.svg',
    categoriesLastUpdated: '2026-10-03',
  };
  const folder = {
    _id: '507f1f77bcf86cd799439012',
    name: 'Documents',
    version: 0,
    createdAt: '',
    updatedAt: '',
  };
  const endpoint = '/api/documents/navigation/section/create-section';
  const sectionEndpoint = `/api/documents/navigation/section/${section._id}`;
  const imageUrl = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
  const uploadedAsset: Asset = {
    _id: 'image-1',
    name: 'photo.png',
    folderId: folder._id,
    tags: [],
    archived: false,
    version: 0,
    storageStatus: 'READY',
    mediaType: 'image/png',
    createdAt: '',
    updatedAt: '',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        // Exercise the exported child routes under a host mount; auth is host-owned.
        provideRouter([{ path: 'document-editor', children: Routes[0].children }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAssetManager(),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    navigation = TestBed.inject(NavigationService);
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create('/document-editor');
  });

  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
    http.verify();
  });

  async function resolveFolder(): Promise<void> {
    http.expectOne('/api/uploader/folders').flush([folder]);
    await harness.fixture.whenStable();
    http.expectOne('/api/uploader/folders').flush([folder]);
    const assets = http.expectOne((request) => request.url === '/api/uploader');
    expect(assets.request.params.get('folderId')).toBe(folder._id);
    expect(assets.request.params.has('root')).toBeFalse();
    assets.flush([{ ...uploadedAsset, storageUrl: '/selected.png' }]);
    await harness.fixture.whenStable();
  }

  async function openPage(): Promise<CreateSectionComponent> {
    const component = await harness.navigateByUrl(
      '/document-editor/create-section',
      CreateSectionComponent
    );
    http.expectNone('/api/uploader/folders');
    return component;
  }

  async function openEditPage(): Promise<CreateSectionComponent> {
    const component = await harness.navigateByUrl(
      `/document-editor/edit-section/${section._id}`,
      CreateSectionComponent
    );
    const request = http.expectOne(sectionEndpoint);
    expect(request.request.method).toBe('GET');
    request.flush(section);
    await harness.fixture.whenStable();
    return component;
  }

  it('shows a separately labelled edit icon on keyboard focus and opens the edit route', async () => {
    navigation.addSection({ ...section, headerSvgPath: imageUrl });
    await harness.fixture.whenStable();
    const card = harness.routeNativeElement?.querySelector('.section-card') as HTMLElement;
    const actions = card.querySelector('.section-card__actions') as HTMLElement;
    const edit = actions.querySelector('a') as HTMLAnchorElement;
    const workshopLink = card.querySelector('.section-card__link') as HTMLAnchorElement;
    expect(edit.parentElement).toBe(actions);
    expect(actions.parentElement).toBe(card);
    expect(workshopLink.contains(edit)).toBeFalse();
    expect(edit.getAttribute('aria-label')).toBe('Edit TypeScript');
    expect(edit.getAttribute('href')).toBe(`/document-editor/edit-section/${section._id}`);
    expect(edit.querySelector('mat-icon')?.textContent).toBe('edit');
    actions.style.transition = 'none';
    expect(getComputedStyle(actions).opacity).toBe(
      matchMedia('(hover: none)').matches ? '1' : '0'
    );
    workshopLink.focus();
    await harness.fixture.whenStable();
    expect(getComputedStyle(actions).opacity).toBe('1');
    edit.click();
    await harness.fixture.whenStable();
    const request = http.expectOne(sectionEndpoint);
    expect(request.request.method).toBe('GET');
    request.flush(section);
    await harness.fixture.whenStable();
    expect(router.url).toBe(`/document-editor/edit-section/${section._id}`);
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Edit Section');
    http.expectNone((r) => r.url === '/api/documents/navigation/workshops');
  });

  it('loads fresh edit values on direct navigation and patches only mutable fields', async () => {
    navigation.addSection({ ...section, sectionTitle: 'Stale title', headerSvgPath: imageUrl });
    navigation.navigateToSection(section._id).subscribe();
    http.expectOne((r) => r.url === '/api/documents/navigation/workshops').flush([]);
    const component = await openEditPage();
    expect(component.editing()).toBeTrue();
    expect(component.form.getRawValue()).toEqual({
      sectionTitle: 'TypeScript',
      sectionDescription: section.sectionDescription,
      menuSvgPath: '/menu.svg',
      headerSvgPath: '/header.svg',
    });
    const values = {
      sectionTitle: 'Renamed',
      sectionDescription: 'Updated workshops.\nNew exercises.',
      menuSvgPath: '',
      headerSvgPath: imageUrl,
    };
    component.form.setValue({
      ...values,
      sectionTitle: ' Renamed ',
      sectionDescription: `  ${values.sectionDescription}  `,
      menuSvgPath: ' ',
    });
    component.create();
    component.create();
    expect(await router.navigateByUrl('/document-editor')).toBeFalse();
    http.expectNone(endpoint);
    const request = http.expectOne(sectionEndpoint);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(values);
    request.flush({ ...section, ...values });
    await harness.fixture.whenStable();
    expect(router.url).toBe('/document-editor');
    expect(harness.routeNativeElement?.querySelectorAll('.section-card').length).toBe(1);
    const link = harness.routeNativeElement?.querySelector('.section-card__link') as HTMLAnchorElement;
    expect(link.textContent).toContain('Renamed');
    expect(link.textContent).toContain(values.sectionDescription);
    expect(link.textContent).not.toContain('42.5');
    expect(link.getAttribute('href')).toBe(`/document-editor/${section._id}/workshop-list`);
    expect(link.querySelector('img')?.getAttribute('src')).toBe(imageUrl);
    navigation.getCurrentSection().subscribe((current) => {
      expect(current?.sectionTitle).toBe('Renamed');
      expect(current?.sectionDescription).toBe(values.sectionDescription);
      expect(current?.summary).toBe(42.5);
      expect(current?._id).toBe(section._id);
    });
  });

  it('uses a multiline description control and no numeric summary input', async () => {
    const component = await openPage();
    const description = harness.routeNativeElement?.querySelector(
      'textarea[formControlName="sectionDescription"]'
    ) as HTMLTextAreaElement;
    expect(description).not.toBeNull();
    expect(description.rows).toBe(4);
    expect(harness.routeNativeElement?.querySelector('[formControlName="summary"]')).toBeNull();
    expect(harness.routeNativeElement?.textContent).not.toContain('Enter a finite number');
    expect(component.form.controls.sectionDescription.value).toBe('');
    expect(Object.keys(component.form.controls)).not.toContain('summary');
  });

  it('clears a description without sending or displaying the legacy numeric summary', async () => {
    const component = await openEditPage();
    component.form.controls.sectionDescription.setValue('   ');
    component.create();
    const request = http.expectOne(sectionEndpoint);
    expect(request.request.body).toEqual({
      sectionTitle: section.sectionTitle,
      sectionDescription: '',
      menuSvgPath: section.menuSvgPath,
      headerSvgPath: section.headerSvgPath,
    });
    request.flush({ ...section, sectionDescription: '', headerSvgPath: imageUrl });
    await harness.fixture.whenStable();
    const card = harness.routeNativeElement?.querySelector('.section-card__link') as HTMLAnchorElement;
    expect(card.querySelector('p')?.textContent?.trim()).toBe('');
    expect(card.textContent).not.toContain('42.5');
    expect((await firstValueFrom(navigation.getSections()))[0].summary).toBe(42.5);
    const editing = await harness.navigateByUrl(
      `/document-editor/edit-section/${section._id}`,
      CreateSectionComponent
    );
    http.expectOne(sectionEndpoint).flush({ ...section, sectionDescription: '' });
    await harness.fixture.whenStable();
    expect(editing.form.controls.sectionDescription.value).toBe('');
  });

  it('retains edits after a failed PATCH and retries without changing the cached section', async () => {
    navigation.addSection({ ...section, headerSvgPath: imageUrl });
    const component = await openEditPage();
    component.form.controls.sectionTitle.setValue('Renamed');
    component.form.controls.sectionDescription.setValue('Unsaved description');
    component.create();
    http.expectOne(sectionEndpoint).flush({}, { status: 500, statusText: 'Server Error' });
    await harness.fixture.whenStable();
    expect(component.saving()).toBeFalse();
    expect(component.form.controls.sectionTitle.value).toBe('Renamed');
    expect(component.form.controls.sectionDescription.value).toBe('Unsaved description');
    expect(component.error()).toContain('Could not save');
    expect((await firstValueFrom(navigation.getSections()))[0].sectionTitle).toBe('TypeScript');
    component.create();
    http.expectOne(sectionEndpoint).flush({ ...section, sectionTitle: 'Renamed', headerSvgPath: imageUrl });
    await harness.fixture.whenStable();
    expect(router.url).toBe('/document-editor');
  });

  it('reports missing sections and retries the read instead of creating a replacement', async () => {
    const component = await harness.navigateByUrl(
      '/document-editor/edit-section/missing',
      CreateSectionComponent
    );
    component.create();
    http.expectNone(endpoint);
    http.expectOne('/api/documents/navigation/section/missing')
      .flush({}, { status: 404, statusText: 'Not Found' });
    await harness.fixture.whenStable();
    expect(component.error()).toContain('no longer exists');
    expect(component.sectionLoaded()).toBeFalse();
    expect((harness.routeNativeElement?.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement).disabled).toBeTrue();
    component.retrySection();
    const read = http.expectOne('/api/documents/navigation/section/missing');
    expect(read.request.method).toBe('GET');
    read.flush({ ...section, _id: 'missing' });
    await harness.fixture.whenStable();
    expect(component.sectionLoaded()).toBeTrue();
    expect(component.error()).toBe('');
    component.returnToSections();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/document-editor');
    http.expectNone((r) => r.method === 'PATCH');
  });

  it('retains unsaved edit values when PATCH is denied or the section was deleted', async () => {
    const component = await openEditPage();
    component.form.controls.sectionTitle.setValue('Unsaved');
    for (const status of [403, 404]) {
      component.create();
      http.expectOne(sectionEndpoint).flush({}, { status, statusText: 'Rejected' });
      await harness.fixture.whenStable();
      expect(component.form.controls.sectionTitle.value).toBe('Unsaved');
      expect(component.error()).toContain(status === 403 ? 'administrator access' : 'no longer exists');
      expect(component.created()).toBeFalse();
    }
    component.returnToSections();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/document-editor');
    expect(harness.routeNativeElement?.querySelectorAll('.section-card').length).toBe(0);
  });

  it('reloads when the edit route switches to a different section ID', async () => {
    const component = await openEditPage();
    const navigating = harness.navigateByUrl(
      '/document-editor/edit-section/angular',
      CreateSectionComponent
    );
    await harness.fixture.whenStable();
    http.expectOne('/api/documents/navigation/section/angular')
      .flush({ ...section, _id: 'angular', sectionTitle: 'Angular' });
    const nextComponent = await navigating;
    expect(nextComponent).toBe(component);
    expect(component.form.controls.sectionTitle.value).toBe('Angular');
    expect(component.sectionLoaded()).toBeTrue();
  });

  it('does not repeat a PATCH if navigation fails after a successful update', async () => {
    const component = await openEditPage();
    spyOn(router, 'navigate').and.rejectWith(new Error('Navigation failed'));
    component.create();
    http.expectOne(sectionEndpoint).flush(section);
    await harness.fixture.whenStable();
    expect(component.error()).toContain('section was saved');
    expect(component.created()).toBeTrue();
    component.create();
    http.expectNone(sectionEndpoint);
  });

  it('opens creation from the catalog link instead of a modal', async () => {
    const link = harness.routeNativeElement?.querySelector(
      '.section-catalog__headline a'
    ) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/document-editor/create-section');
    link.click();
    await harness.fixture.whenStable();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/document-editor/create-section');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Create Section');
    expect(document.querySelector('mat-dialog-container')).toBeNull();
  });

  it('submits all four fields once and returns to the catalog with the server ID', async () => {
    const component = await openPage();
    const values = {
      sectionTitle: '  TypeScript  ',
      sectionDescription: `  ${section.sectionDescription}  `,
      menuSvgPath: '  /menu.svg  ',
      headerSvgPath: '  /header.svg  ',
    };
    for (const [name, value] of Object.entries(values)) {
      const input = harness.routeNativeElement?.querySelector(
        `[formControlName="${name}"]`
      ) as HTMLInputElement | HTMLTextAreaElement;
      input.value = String(value);
      input.dispatchEvent(new Event('input'));
    }
    await harness.fixture.whenStable();
    harness.routeNativeElement?.querySelector('form')?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
    component.create();
    await harness.fixture.whenStable();
    expect(component.saving()).toBeTrue();
    expect((harness.routeNativeElement?.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement).disabled).toBeTrue();
    expect(await router.navigateByUrl('/document-editor')).toBeFalse();
    const request = http.expectOne(endpoint);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      sectionTitle: 'TypeScript',
      sectionDescription: section.sectionDescription,
      menuSvgPath: '/menu.svg',
      headerSvgPath: '/header.svg',
    });
    request.flush({ ...section, headerSvgPath: imageUrl });
    await harness.fixture.whenStable();
    expect(router.url).toBe('/document-editor');
    const link = harness.routeNativeElement?.querySelector(
      'a.section-card__link'
    ) as HTMLAnchorElement;
    expect(link.textContent).toContain('TypeScript');
    expect(link.textContent).toContain(section.sectionDescription);
    expect(link.textContent).not.toContain('42.5');
    expect(link.getAttribute('href')).toBe(
      `/document-editor/${section._id}/workshop-list`
    );
    expect(link.querySelector('img')?.getAttribute('src')).toBe(imageUrl);
  });

  it('uses configured artwork for any section ID and falls back when absent', async () => {
    navigation.fetchSections().subscribe();
    http.expectOne('/api/documents/navigation/sections').flush({
      sections: {
        [section._id]: { ...section, headerSvgPath: imageUrl },
        angular: { ...section, _id: 'angular', sectionTitle: 'Angular', headerSvgPath: '' },
      },
    });
    await harness.fixture.whenStable();
    const links = harness.routeNativeElement?.querySelectorAll('a.section-card__link');
    expect(links?.length).toBe(2);
    expect(links?.[0].querySelector('img')?.getAttribute('src')).toBe(imageUrl);
    expect(links?.[1].querySelector('mat-icon')).not.toBeNull();
    expect(harness.routeNativeElement?.querySelector('a.section-card__link svg')).toBeNull();
    navigation.navigateToSection(section._id).subscribe();
    const request = http.expectOne((r) => r.url === '/api/documents/navigation/workshops');
    expect(request.request.params.get('section')).toBe(section._id);
    request.flush([]);
  });

  it('rejects invalid names and permits an empty description', async () => {
    const component = await openPage();
    for (const name of ['', '   ', 'a'.repeat(121)]) {
      component.form.controls.sectionTitle.setValue(name);
      component.create();
      expect(component.form.invalid).toBeTrue();
      http.expectNone(endpoint);
    }
    component.form.controls.sectionTitle.setValue('TypeScript');
    component.form.controls.sectionDescription.setValue('');
    expect(component.form.valid).toBeTrue();
  });

  it('retains all fields and allows retry after a failed request', async () => {
    const component = await openPage();
    const values = {
      sectionTitle: 'TypeScript',
      sectionDescription: section.sectionDescription,
      menuSvgPath: section.menuSvgPath,
      headerSvgPath: section.headerSvgPath,
    };
    component.form.setValue(values);
    component.create();
    http.expectOne(endpoint).flush({}, { status: 500, statusText: 'Server Error' });
    await harness.fixture.whenStable();
    expect(component.saving()).toBeFalse();
    expect(component.form.getRawValue()).toEqual(values);
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent)
      .toContain('Please try again');
    component.create();
    http.expectOne(endpoint).flush({ ...section, headerSvgPath: imageUrl });
    await harness.fixture.whenStable();
    expect(router.url).toBe('/document-editor');
  });

  it('explains permission denial without adding a section', async () => {
    const component = await openPage();
    component.form.controls.sectionTitle.setValue('TypeScript');
    component.create();
    http.expectOne(endpoint).flush({}, { status: 403, statusText: 'Forbidden' });
    await harness.fixture.whenStable();
    expect(component.error()).toContain('administrator access');
    await harness.navigateByUrl('/document-editor', SectionListComponent);
    expect(harness.routeNativeElement?.querySelectorAll('a.section-card__link').length).toBe(0);
  });

  it('cancels to the mounted catalog without sending a create request', async () => {
    await openPage();
    (harness.routeNativeElement?.querySelector(
      '.section-form__form-actions button[type="button"]'
    ) as HTMLButtonElement).click();
    await harness.fixture.whenStable();
    http.expectNone(endpoint);
    expect(router.url).toBe('/document-editor');
  });

  it('shows navigation failure after creation without allowing a duplicate POST', async () => {
    const component = await openPage();
    component.form.controls.sectionTitle.setValue('TypeScript');
    spyOn(router, 'navigate').and.resolveTo(false);
    component.create();
    http.expectOne(endpoint).flush(section);
    await harness.fixture.whenStable();
    expect(component.created()).toBeTrue();
    expect(component.error()).toContain('section was created');
    component.create();
    http.expectNone(endpoint);
  });

  for (const editing of [false, true]) {
    it(`returns dialog selection only to its originating section field (${editing ? 'edit' : 'create'})`, async () => {
      const component = editing ? await openEditPage() : await openPage();
      expect(harness.routeNativeElement?.querySelector('ngx-asset-manager')).toBeNull();
      for (const [field, label] of [
        ['menuSvgPath', 'Choose menu image'],
        ['headerSvgPath', 'Choose header image'],
      ] as const) {
        const other = field === 'menuSvgPath' ? 'headerSvgPath' : 'menuSvgPath';
        const previous = component.form.controls[other].value;
        const button = harness.routeNativeElement?.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;
        expect(button.type).toBe('button');
        button.focus();
        button.click();
        await resolveFolder();
        expect(component.form.controls[field].dirty).toBeFalse();
        (document.querySelector('button[aria-label="Select photo.png"]') as HTMLButtonElement).click();
        await harness.fixture.whenStable();
        expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
        expect(component.form.controls[field].value).toBe('/selected.png');
        expect(component.form.controls[field].dirty).toBeTrue();
        expect(component.form.controls[other].value).toBe(previous);
        expect(document.activeElement).toBe(button);
      }
      expect(harness.routeNativeElement?.textContent).not.toContain('Use for');
      expect(harness.routeNativeElement?.querySelector('.section-form__image-preview')?.getAttribute('src')).toBe('/selected.png');
    });
  }

  it('preserves manual image values when the modal is cancelled after denied folder access', async () => {
    const component = await openPage();
    component.form.controls.headerSvgPath.setValue('/manual.svg');
    (harness.routeNativeElement?.querySelector('button[aria-label="Choose header image"]') as HTMLButtonElement).click();
    http.expectOne('/api/uploader/folders').flush({}, { status: 403, statusText: 'Forbidden' });
    await harness.fixture.whenStable();
    expect(document.querySelector('mat-dialog-container [role="alert"]')?.textContent).toContain('permission');
    (document.querySelector('mat-dialog-actions button') as HTMLButtonElement).click();
    await harness.fixture.whenStable();
    expect(component.form.controls.headerSvgPath.value).toBe('/manual.svg');
    expect(component.form.controls.headerSvgPath.dirty).toBeFalse();
    component.form.controls.sectionTitle.setValue('TypeScript');
    component.create();
    const request = http.expectOne(endpoint);
    expect(request.request.body.headerSvgPath).toBe('/manual.svg');
    request.flush({ ...section, headerSvgPath: imageUrl });
    await harness.fixture.whenStable();
  });

  it('disables section image actions while loading, saving and after confirmed save', async () => {
    const component = await harness.navigateByUrl(
      `/document-editor/edit-section/${section._id}`, CreateSectionComponent
    );
    const button = harness.routeNativeElement?.querySelector('button[aria-label="Choose menu image"]') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
    http.expectOne(sectionEndpoint).flush(section);
    await harness.fixture.whenStable();
    expect(button.disabled).toBeFalse();
    spyOn(router, 'navigate').and.resolveTo(false);
    component.create();
    await harness.fixture.whenStable();
    expect(button.disabled).toBeTrue();
    http.expectOne(sectionEndpoint).flush(section);
    await harness.fixture.whenStable();
    expect(button.disabled).toBeTrue();
    button.click();
    http.expectNone('/api/uploader/folders');
  });

  it('closes the picker when a reused edit route loads another section', async () => {
    const component = await openEditPage();
    (harness.routeNativeElement?.querySelector('button[aria-label="Choose header image"]') as HTMLButtonElement).click();
    await resolveFolder();
    await harness.navigateByUrl('/document-editor/edit-section/angular', CreateSectionComponent);
    await harness.fixture.whenStable();
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
    http.expectOne('/api/documents/navigation/section/angular').flush({
      ...section, _id: 'angular', sectionTitle: 'Angular', headerSvgPath: '/angular.svg',
    });
    await harness.fixture.whenStable();
    expect(component.form.controls.headerSvgPath.value).toBe('/angular.svg');
    expect(component.form.controls.headerSvgPath.dirty).toBeFalse();
  });

  for (const editing of [false, true]) {
    it(`previews menu and header independently as icons or images (${editing ? 'edit' : 'create'})`, async () => {
      const component = editing ? await openEditPage() : await openPage();
      component.form.patchValue({
        menuSvgPath: 'devicon-angular-plain colored',
        headerSvgPath: '/header.svg',
      });
      harness.detectChanges();
      const menuIcon = harness.routeNativeElement?.querySelector('.section-form__menu-icon-preview i') as HTMLElement;
      expect(menuIcon.classList.contains('devicon-angular-plain')).toBeTrue();
      expect(harness.routeNativeElement?.querySelector('.section-form__menu-image-preview')).toBeNull();
      expect(harness.routeNativeElement?.querySelector('.section-form__header-image-preview')?.getAttribute('src')).toBe('/header.svg');
      expect(harness.routeNativeElement?.querySelector('.section-form__header-icon-preview')).toBeNull();
      component.form.patchValue({
        menuSvgPath: '/menu.svg',
        headerSvgPath: 'devicon-react-original colored',
      });
      harness.detectChanges();
      expect(harness.routeNativeElement?.querySelector('.section-form__menu-image-preview')?.getAttribute('src')).toBe('/menu.svg');
      expect(harness.routeNativeElement?.querySelector('.section-form__menu-icon-preview')).toBeNull();
      expect(harness.routeNativeElement?.querySelector('.section-form__header-image-preview')).toBeNull();
      expect(harness.routeNativeElement?.querySelector('.section-form__header-icon-preview i')?.classList.contains('devicon-react-original')).toBeTrue();
      component.form.controls.headerSvgPath.setValue('');
      harness.detectChanges();
      expect(harness.routeNativeElement?.querySelector('.section-form__header-icon-preview')).toBeNull();
      expect(harness.routeNativeElement?.querySelector('.section-form__header-image-preview')).toBeNull();
      expect(harness.routeNativeElement?.querySelector('.section-form__menu-image-preview')).not.toBeNull();
      component.form.patchValue({ menuSvgPath: 'devicon-angular-plain', headerSvgPath: '' });
      harness.detectChanges();
      expect(harness.routeNativeElement?.querySelector('.section-form__menu-icon-preview')).not.toBeNull();
    });
  }

  for (const editing of [false, true]) {
    it(`saves Devicon strings unchanged apart from trimming and renders the saved catalog/header (${editing ? 'edit' : 'create'})`, async () => {
      const component = editing ? await openEditPage() : await openPage();
      component.form.controls.sectionTitle.setValue(section.sectionTitle);
      const headerInput = harness.routeNativeElement?.querySelector('[formControlName="headerSvgPath"]') as HTMLInputElement;
      headerInput.value = ' devicon-angular-plain colored ';
      headerInput.dispatchEvent(new Event('input'));
      component.form.controls.menuSvgPath.setValue(' devicon-react-original ');
      harness.detectChanges();
      expect(harness.routeNativeElement?.querySelector('.section-form__header-icon-preview i')?.classList.contains('devicon-angular-plain')).toBeTrue();
      expect(harness.routeNativeElement?.querySelector('.section-form__header-image-preview')).toBeNull();
      component.create();
      const save = http.expectOne(editing ? sectionEndpoint : endpoint);
      expect(save.request.body.menuSvgPath).toBe('devicon-react-original');
      expect(save.request.body.headerSvgPath).toBe('devicon-angular-plain colored');
      const saved = { ...section, menuSvgPath: 'devicon-react-original', headerSvgPath: 'devicon-angular-plain colored' };
      save.flush(saved);
      await harness.fixture.whenStable();
      const card = harness.routeNativeElement?.querySelector('.section-card__link') as HTMLElement;
      expect(card.querySelector('img')).toBeNull();
      expect(card.querySelector('ngx-menu-devicon i')?.classList.contains('devicon-angular-plain')).toBeTrue();
      navigation.navigateToSection(section._id).subscribe();
      http.expectOne((r) => r.url === '/api/documents/navigation/workshops').flush([]);
      await harness.navigateByUrl(`/document-editor/${section._id}/workshop-list`);
      expect(harness.routeNativeElement?.querySelector('.workshops__icon i')?.classList.contains('devicon-angular-plain')).toBeTrue();
      expect(harness.routeNativeElement?.querySelector('ngx-particle-header img')).toBeNull();
      navigation.addSection({ ...saved, headerSvgPath: imageUrl });
      await harness.fixture.whenStable();
      expect(harness.routeNativeElement?.querySelector('.workshops__icon')).toBeNull();
      expect(harness.routeNativeElement?.querySelector('ngx-particle-header img')?.getAttribute('src')).toBe(imageUrl);
    });
  }
});
