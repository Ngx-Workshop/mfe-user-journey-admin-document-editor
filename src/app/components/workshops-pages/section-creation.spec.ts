import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SectionDto } from '@tmdjr/document-contracts';
import { Asset, provideAssetManager } from '@tmdjr/ngx-asset-manager';
import { firstValueFrom } from 'rxjs';
import { Routes } from '../../app.routes';
import { NavigationService } from '../../services/navigation.service';
import { CreateSectionComponent } from './create-section.component';
import { SectionListComponent } from './section-list.component';

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

  afterEach(() => http.verify());

  async function resolveFolder(): Promise<void> {
    http.expectOne('/api/uploader/folders').flush([folder]);
    await harness.fixture.whenStable();
    http.expectOne('/api/uploader/folders').flush([folder]);
    const assets = http.expectOne((request) => request.url === '/api/uploader');
    expect(assets.request.params.get('folderId')).toBe(folder._id);
    expect(assets.request.params.has('root')).toBeFalse();
    assets.flush([]);
    await harness.fixture.whenStable();
  }

  async function openPage(loadFolder = true): Promise<CreateSectionComponent> {
    const component = await harness.navigateByUrl(
      '/document-editor/create-section',
      CreateSectionComponent
    );
    if (loadFolder) await resolveFolder();
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
    await resolveFolder();
    return component;
  }

  it('shows a separately labelled edit icon on keyboard focus and opens the edit route', async () => {
    navigation.addSection({ ...section, headerSvgPath: imageUrl });
    await harness.fixture.whenStable();
    const card = harness.routeNativeElement?.querySelector('.section-card') as HTMLElement;
    const edit = card.querySelector('.section-edit') as HTMLAnchorElement;
    const workshopLink = card.querySelector('.home-row-column') as HTMLAnchorElement;
    expect(edit.parentElement).toBe(card);
    expect(workshopLink.contains(edit)).toBeFalse();
    expect(edit.getAttribute('aria-label')).toBe('Edit TypeScript');
    expect(edit.getAttribute('href')).toBe(`/document-editor/edit-section/${section._id}`);
    expect(edit.querySelector('mat-icon')?.textContent).toBe('edit');
    edit.style.transition = 'none';
    expect(getComputedStyle(edit).opacity).toBe(
      matchMedia('(hover: none)').matches ? '1' : '0'
    );
    workshopLink.focus();
    await harness.fixture.whenStable();
    expect(getComputedStyle(edit).opacity).toBe('1');
    edit.click();
    await harness.fixture.whenStable();
    const request = http.expectOne(sectionEndpoint);
    expect(request.request.method).toBe('GET');
    request.flush(section);
    await resolveFolder();
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
    const link = harness.routeNativeElement?.querySelector('.home-row-column') as HTMLAnchorElement;
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
    const card = harness.routeNativeElement?.querySelector('.home-row-column') as HTMLAnchorElement;
    expect(card.querySelector('p')?.textContent?.trim()).toBe('');
    expect(card.textContent).not.toContain('42.5');
    expect((await firstValueFrom(navigation.getSections()))[0].summary).toBe(42.5);
    const editing = await harness.navigateByUrl(
      `/document-editor/edit-section/${section._id}`,
      CreateSectionComponent
    );
    http.expectOne(sectionEndpoint).flush({ ...section, sectionDescription: '' });
    await resolveFolder();
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
    await resolveFolder();
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
      '.header-start a'
    ) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/document-editor/create-section');
    link.click();
    await harness.fixture.whenStable();
    await resolveFolder();
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
      'a.home-row-column'
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
    const links = harness.routeNativeElement?.querySelectorAll('a.home-row-column');
    expect(links?.length).toBe(2);
    expect(links?.[0].querySelector('img')?.getAttribute('src')).toBe(imageUrl);
    expect(links?.[1].querySelector('mat-icon')).not.toBeNull();
    expect(harness.routeNativeElement?.querySelector('a.home-row-column svg')).toBeNull();
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
    expect(harness.routeNativeElement?.querySelectorAll('a.home-row-column').length).toBe(0);
  });

  it('cancels to the mounted catalog without sending a create request', async () => {
    await openPage();
    (harness.routeNativeElement?.querySelector(
      '.form-actions button[type="button"]'
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

  it('does not fall back to root when the documents folder is missing and supports retry', async () => {
    const component = await openPage(false);
    http.expectOne('/api/uploader/folders').flush([]);
    await harness.fixture.whenStable();
    expect(component.assetFolderError()).toContain('documents asset folder');
    expect(harness.routeNativeElement?.querySelector('ngx-asset-manager')).toBeNull();
    http.expectNone((request) => request.url === '/api/uploader');
    component.loadAssetFolder();
    await resolveFolder();
    expect(harness.routeNativeElement?.querySelector('ngx-asset-manager')).not.toBeNull();
  });

  it('allows manual metadata creation after denied folder access', async () => {
    const component = await openPage(false);
    component.form.controls.sectionTitle.setValue('TypeScript');
    http.expectOne('/api/uploader/folders').flush({}, { status: 403, statusText: 'Forbidden' });
    await harness.fixture.whenStable();
    expect(component.assetFolderError()).toContain('permission');
    expect(component.form.controls.sectionTitle.value).toBe('TypeScript');
    component.create();
    const request = http.expectOne(endpoint);
    expect(request.request.body).toEqual({
      sectionTitle: 'TypeScript', sectionDescription: '', menuSvgPath: '', headerSvgPath: '',
    });
    request.flush({ ...section, headerSvgPath: imageUrl });
    await harness.fixture.whenStable();
    expect(router.url).toBe('/document-editor');
  });

  it('reports missing asset URLs instead of silently clearing an image path', async () => {
    const component = await openPage();
    component.assetSelected.set(uploadedAsset);
    component.form.controls.headerSvgPath.setValue('/existing.svg');
    component.useSelectedAsset('headerSvgPath');
    expect(component.assetSelectionError()).toContain('no usable URL');
    expect(component.form.controls.headerSvgPath.value).toBe('/existing.svg');
  });

  it('applies the selected image URL independently to either artwork field', async () => {
    const component = await openPage();
    component.assetSelected.set({
      ...uploadedAsset,
      storageUrl: 'https://example.test/photo.png',
    });
    component.useSelectedAsset('menuSvgPath');
    expect(component.form.controls.menuSvgPath.value).toBe('https://example.test/photo.png');
    expect(component.form.controls.headerSvgPath.value).toBe('');
    component.useSelectedAsset('headerSvgPath');
    expect(component.form.controls.headerSvgPath.value).toBe('https://example.test/photo.png');
    expect(component.assetSelectionError()).toBe('');
  });

  it('uploads only images to the resolved folder and retains picker selection', async () => {
    const component = await openPage();
    const picker = harness.routeNativeElement?.querySelector('input[type="file"]') as HTMLInputElement;
    expect(picker.accept).toBe('image/*');
    const setFile = (file: File) => {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      picker.files = transfer.files;
      picker.dispatchEvent(new Event('change', { bubbles: true }));
    };
    setFile(new File(['pdf'], 'notes.pdf', { type: 'application/pdf' }));
    await harness.fixture.whenStable();
    const button = Array.from(harness.routeNativeElement?.querySelectorAll('ngx-asset-upload button') ?? [])
      .find((item) => item.textContent?.includes('Upload file')) as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
    http.expectNone('/api/uploader/upload');
    setFile(new File(['image'], 'photo.png', { type: 'image/png' }));
    await harness.fixture.whenStable();
    button.click();
    await harness.fixture.whenStable();
    const request = http.expectOne('/api/uploader/upload');
    expect(request.request.withCredentials).toBeTrue();
    expect((request.request.body as FormData).get('folderId')).toBe(folder._id);
    request.flush(uploadedAsset);
    await harness.fixture.whenStable();
    http.expectOne('/api/uploader/folders').flush([folder]);
    http.expectOne((r) => r.url === '/api/uploader').flush([]);
    await harness.fixture.whenStable();
    expect(component.assetSelected()?.name).toBe('photo.png');
    expect(harness.routeNativeElement?.textContent).toContain('Selected image: photo.png');
  });
});
