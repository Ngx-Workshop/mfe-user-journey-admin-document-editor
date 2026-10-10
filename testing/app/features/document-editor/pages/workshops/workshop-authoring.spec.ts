import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SectionDto, WorkshopDto } from '@tmdjr/document-contracts';
import { Asset, provideAssetManager } from '@tmdjr/ngx-asset-manager';
import { firstValueFrom } from 'rxjs';
import { Routes } from '../../../../../../src/app/app.routes';
import { CreateWorkshopComponent } from '../../../../../../src/app/features/document-editor/pages/workshops/create-workshop.component';
import { OptimizeCloudinaryUrlPipe } from '../../../../../../src/app/features/document-editor/pages/workshops/workshop-list.component';
import { NavigationService } from '../../../../../../src/app/features/document-editor/state/navigation.service';

describe('Workshop authoring pages', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let router: Router;
  let navigation: NavigationService;
  const section: SectionDto = {
    _id: '507f1f77bcf86cd799439011',
    sectionTitle: 'TypeScript',
    sectionDescription: 'Typed workshops',
    summary: 1,
    menuSvgPath: '',
    headerSvgPath: '',
    categoriesLastUpdated: '',
  };
  const workshop: WorkshopDto = {
    _id: '507f1f77bcf86cd799439012',
    sectionId: section._id,
    sortId: 0,
    name: 'Types',
    summary: 'Learn types',
    thumbnail: '/types.png',
    workshopDocumentGroupId: 'types',
    workshopDocuments: [
      {
        _id: 'page-1',
        kind: 'PAGE' as const,
        name: 'Introduction',
        sortId: 0,
      },
    ],
    workshopDocumentsLastUpdated: '',
  };
  const folder = {
    _id: '507f1f77bcf86cd799439013',
    name: 'Documents',
    version: 0,
    createdAt: '',
    updatedAt: '',
  };
  const asset: Asset = {
    _id: 'image-1',
    name: 'photo.png',
    folderId: folder._id,
    tags: [],
    archived: false,
    version: 0,
    storageStatus: 'READY',
    storageUrl: '/photo.png',
    mediaType: 'image/png',
    createdAt: '',
    updatedAt: '',
  };
  const createUrl = `/document-editor/${section._id}/create-workshop`;
  const editUrl = `/document-editor/${section._id}/edit-workshop/${workshop._id}`;
  const catalogUrl = `/document-editor/${section._id}/workshop-list`;
  const listEndpoint = `/api/documents/navigation/workshops?section=${section._id}`;
  const createEndpoint =
    '/api/documents/navigation/workshop/create-workshop';
  const editEndpoint =
    '/api/documents/navigation/workshop/edit-workshop-name-and-summary';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        // The shell owns root authentication and initial section resolution.
        provideRouter([
          { path: 'document-editor', children: Routes[0].children },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAssetManager(),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    navigation = TestBed.inject(NavigationService);
    navigation.addSection(section);
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
    const request = http.expectOne((r) => r.url === '/api/uploader');
    expect(request.request.params.get('folderId')).toBe(folder._id);
    expect(request.request.params.has('root')).toBeFalse();
    expect(request.request.withCredentials).toBeTrue();
    request.flush([asset]);
    await harness.fixture.whenStable();
  }

  async function openPage(
    editing = false
  ): Promise<CreateWorkshopComponent> {
    const component = await harness.navigateByUrl(
      editing ? editUrl : createUrl,
      CreateWorkshopComponent
    );
    http.expectOne(listEndpoint).flush([workshop]);
    await harness.fixture.whenStable();
    http.expectNone('/api/uploader/folders');
    return component;
  }

  async function flushCatalog(
    workshops: WorkshopDto[] = [workshop]
  ): Promise<void> {
    // Let lazy route imports resolve before flushing the section resolver.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    http.expectOne(listEndpoint).flush(workshops);
    await harness.fixture.whenStable();
  }

  it('reveals labelled card actions on keyboard focus and routes edit independently of the workshop link', async () => {
    const navigationPromise = harness.navigateByUrl(catalogUrl);
    await flushCatalog();
    await navigationPromise;
    const create = Array.from(
      harness.routeNativeElement?.querySelectorAll('a') ?? []
    ).find((link) =>
      link.textContent?.includes('Create New Workshop')
    ) as HTMLAnchorElement;
    const edit = harness.routeNativeElement?.querySelector(
      '.workshop-card__edit'
    ) as HTMLAnchorElement;
    const card = harness.routeNativeElement?.querySelector(
      '.workshop-card'
    ) as HTMLElement;
    const editorLink = card.querySelector(
      '.workshop-card__link'
    ) as HTMLAnchorElement;
    const actions = card.querySelector(
      '.workshop-card__actions'
    ) as HTMLElement;
    const remove = card.querySelector(
      '.workshop-card__delete'
    ) as HTMLButtonElement;
    const sidebar = harness.routeNativeElement?.querySelector(
      'ngx-workshop-list-control'
    ) as HTMLElement;
    expect(create.getAttribute('href')).toBe(createUrl);
    expect(edit.getAttribute('href')).toBe(editUrl);
    expect(edit.getAttribute('aria-label')).toBe('Edit Types');
    expect(remove.getAttribute('aria-label')).toBe('Delete Types');
    expect(remove.type).toBe('button');
    expect(actions.parentElement).toBe(card);
    expect(editorLink.parentElement).toBe(card);
    expect(editorLink.contains(edit)).toBeFalse();
    expect(editorLink.contains(remove)).toBeFalse();
    expect(card.getAttribute('href')).toBeNull();
    expect(editorLink.getAttribute('href')).toBe(
      `/document-editor/${section._id}/types/page-1`
    );
    expect(
      sidebar.querySelector(
        '.workshop-card__edit, .workshop-card__delete'
      )
    ).toBeNull();
    expect(
      sidebar
        .querySelector('.workshop-order__link')
        ?.getAttribute('href')
    ).toBe(editorLink.getAttribute('href'));
    expect(sidebar.querySelector('.cdk-drag')).not.toBeNull();
    actions.style.transition = 'none';
    expect(getComputedStyle(actions).opacity).toBe(
      matchMedia('(hover: none)').matches ? '1' : '0'
    );
    expect(getComputedStyle(actions).pointerEvents).toBe(
      matchMedia('(hover: none)').matches ? 'auto' : 'none'
    );
    editorLink.focus();
    await harness.fixture.whenStable();
    expect(getComputedStyle(actions).opacity).toBe('1');
    expect(getComputedStyle(actions).pointerEvents).toBe('auto');
    edit.focus();
    await harness.fixture.whenStable();
    expect(getComputedStyle(actions).opacity).toBe('1');
    edit.click();
    await harness.fixture.whenStable();
    http.expectOne(listEndpoint).flush([workshop]);
    await harness.fixture.whenStable();
    expect(router.url).toBe(editUrl);
    expect(
      harness.routeNativeElement
        ?.querySelector('h1')
        ?.textContent?.trim()
    ).toBe('Edit Workshop');
    http.expectNone((r) => r.url.includes('/workshop/page-1'));
  });

  it('opens delete for the selected card without opening a page and cancels without mutation', async () => {
    const other = {
      ...workshop,
      _id: 'other-id',
      name: 'Other',
      workshopDocumentGroupId: 'other',
    };
    const navigating = harness.navigateByUrl(catalogUrl);
    await flushCatalog([workshop, other]);
    await navigating;
    const cards =
      harness.routeNativeElement?.querySelectorAll('.workshop-card');
    expect(cards?.length).toBe(2);
    const remove = cards?.[1].querySelector(
      '.workshop-card__delete'
    ) as HTMLButtonElement;
    expect(remove.getAttribute('aria-label')).toBe('Delete Other');
    remove.focus();
    remove.click();
    await harness.fixture.whenStable();
    expect(router.url).toBe(catalogUrl);
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(1);
    expect(
      document.querySelector('mat-dialog-container h2')?.textContent
    ).toBe('Delete Other?');
    const name = document.querySelector(
      'mat-dialog-container input[formControlName="name"]'
    ) as HTMLInputElement;
    const confirm = Array.from(
      document.querySelectorAll('mat-dialog-actions button')
    ).find(
      (button) => button.textContent?.trim() === 'Delete'
    ) as HTMLButtonElement;
    expect(confirm.disabled).toBeTrue();
    name.value = workshop.name;
    name.dispatchEvent(new Event('input'));
    await harness.fixture.whenStable();
    expect(confirm.disabled).toBeTrue();
    name.value = other.name;
    name.dispatchEvent(new Event('input'));
    await harness.fixture.whenStable();
    expect(confirm.disabled).toBeFalse();
    const cancel = Array.from(
      document.querySelectorAll('mat-dialog-actions button')
    ).find(
      (button) => button.textContent?.trim() === 'Cancel'
    ) as HTMLButtonElement;
    cancel.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
    expect(document.activeElement).toBe(remove);
    expect(router.url).toBe(catalogUrl);
    expect(
      harness.routeNativeElement?.querySelectorAll('.workshop-card')
        .length
    ).toBe(2);
    http.expectNone(
      '/api/documents/navigation/workshop/delete-workshop-and-workshop-documents'
    );
    http.expectNone((r) =>
      r.url.startsWith('/api/documents/workshop/')
    );
  });

  it('keeps name-confirmed deletion and refreshes the catalog from the card action', async () => {
    const navigating = harness.navigateByUrl(catalogUrl);
    await flushCatalog();
    await navigating;
    (
      harness.routeNativeElement?.querySelector(
        '.workshop-card__delete'
      ) as HTMLButtonElement
    ).click();
    await harness.fixture.whenStable();
    const name = document.querySelector(
      'mat-dialog-container input[formControlName="name"]'
    ) as HTMLInputElement;
    name.value = workshop.name;
    name.dispatchEvent(new Event('input'));
    await harness.fixture.whenStable();
    const confirm = Array.from(
      document.querySelectorAll('mat-dialog-actions button')
    ).find(
      (button) => button.textContent?.trim() === 'Delete'
    ) as HTMLButtonElement;
    confirm.click();
    const request = http.expectOne(
      '/api/documents/navigation/workshop/delete-workshop-and-workshop-documents'
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ _id: workshop._id });
    request.flush({ acknowledged: true, deletedCount: 1 });
    http.expectOne(listEndpoint).flush([]);
    await harness.fixture.whenStable();
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
    expect(router.url).toBe(catalogUrl);
    expect(
      harness.routeNativeElement?.querySelectorAll('.workshop-card')
        .length
    ).toBe(0);
    expect(harness.routeNativeElement?.textContent).toContain(
      'No workshops yet.'
    );
    http.expectNone((r) =>
      r.url.startsWith('/api/documents/workshop/')
    );
  });

  it('keeps card actions in place while long workshop content scrolls', async () => {
    const navigating = harness.navigateByUrl(catalogUrl);
    await flushCatalog([
      { ...workshop, summary: 'Long workshop summary. '.repeat(100) },
    ]);
    await navigating;
    const card = harness.routeNativeElement?.querySelector(
      '.workshop-card'
    ) as HTMLElement;
    card.style.animation = 'none';
    card.style.opacity = '1';
    card.style.clipPath = 'none';
    const link = card.querySelector(
      '.workshop-card__link'
    ) as HTMLAnchorElement;
    const actions = card.querySelector(
      '.workshop-card__actions'
    ) as HTMLElement;
    actions.style.transition = 'none';
    link.focus();
    await harness.fixture.whenStable();
    const top = actions.getBoundingClientRect().top;
    link.scrollTop = 100;
    expect(link.scrollTop).toBeGreaterThan(0);
    expect(actions.getBoundingClientRect().top).toBe(top);
    expect(getComputedStyle(actions).opacity).toBe('1');
  });

  it('loads a fresh workshop on direct edit, preserves IDs and submits only mutable fields', async () => {
    navigation.navigateToSection(section._id).subscribe();
    http
      .expectOne(listEndpoint)
      .flush([{ ...workshop, name: 'Stale' }]);
    navigation
      .navigateToWorkshop(workshop.workshopDocumentGroupId)
      .subscribe();
    const component = await openPage(true);
    expect(component.editing()).toBeTrue();
    expect(component.form.getRawValue()).toEqual({
      name: workshop.name,
      summary: workshop.summary,
      thumbnail: workshop.thumbnail,
    });
    component.form.setValue({
      name: ' Renamed ',
      summary: ' New summary ',
      thumbnail: ' /photo.png ',
    });
    component.save();
    component.save();
    expect(component.saving()).toBeTrue();
    expect(
      await router.navigateByUrl('/document-editor')
    ).toBeFalse();
    const request = http.expectOne(editEndpoint);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      _id: workshop._id,
      name: 'Renamed',
      summary: 'New summary',
      thumbnail: '/photo.png',
    });
    http.expectNone(createEndpoint);
    const updated = {
      ...workshop,
      name: 'Renamed',
      summary: 'New summary',
      thumbnail: '/photo.png',
      workshopDocumentGroupId: 'renamed',
    };
    request.flush(updated);
    expect(
      (await firstValueFrom(navigation.getCurrentWorkshop()))?.name
    ).toBe('Renamed');
    expect(await firstValueFrom(navigation.getWorkshops())).toEqual([
      updated,
    ]);
    await flushCatalog([updated]);
    expect(router.url).toBe(catalogUrl);
    const image = harness.routeNativeElement?.querySelector(
      '.workshop-card__artwork img'
    ) as HTMLImageElement;
    expect(image.getAttribute('src')).toBe('/photo.png');
    expect(
      harness.routeNativeElement
        ?.querySelector('.workshop-order__link')
        ?.getAttribute('href')
    ).toBe(`/document-editor/${section._id}/renamed/page-1`);
  });

  it('creates with section ID and count, blocks duplicate saves and returns to a fresh catalog', async () => {
    const component = await openPage();
    expect(component.editing()).toBeFalse();
    component.form.setValue({
      name: ' New workshop ',
      summary: ' New summary ',
      thumbnail: '',
    });
    component.save();
    component.save();
    expect(
      await router.navigateByUrl('/document-editor')
    ).toBeFalse();
    const request = http.expectOne(createEndpoint);
    expect(request.request.body).toEqual({
      sectionId: section._id,
      sortId: 1,
      name: 'New workshop',
      summary: 'New summary',
      thumbnail: '',
    });
    const created = {
      ...workshop,
      _id: 'new-id',
      name: 'New workshop',
      sortId: 1,
      thumbnail: '/photo.png',
      workshopDocumentGroupId: 'new-workshop',
    };
    request.flush(created);
    expect(await firstValueFrom(navigation.getWorkshops())).toEqual([
      workshop,
      created,
    ]);
    await flushCatalog([workshop, created]);
    expect(router.url).toBe(catalogUrl);
    expect(
      harness.routeNativeElement?.querySelectorAll('.workshop-card')
        .length
    ).toBe(2);
  });

  it('validates whitespace-only name/summary and preserves edit thumbnail requirements', async () => {
    const component = await openPage(true);
    for (const values of [
      { name: ' ', summary: 'Summary', thumbnail: '/photo.png' },
      { name: 'Name', summary: '\n ', thumbnail: '/photo.png' },
      { name: 'Name', summary: 'Summary', thumbnail: ' ' },
    ]) {
      component.form.setValue(values);
      component.save();
      expect(component.form.invalid).toBeTrue();
      expect(component.form.touched).toBeTrue();
    }
    http.expectNone(editEndpoint);
  });

  it('creates the first workshop without a thumbnail and renders the catalog fallback', async () => {
    const component = await harness.navigateByUrl(
      createUrl,
      CreateWorkshopComponent
    );
    http.expectOne(listEndpoint).flush([]);
    await harness.fixture.whenStable();
    component.form.setValue({
      name: 'First',
      summary: 'First workshop',
      thumbnail: '',
    });
    component.save();
    const request = http.expectOne(createEndpoint);
    expect(request.request.body.sortId).toBe(0);
    expect(request.request.body.thumbnail).toBe('');
    const created = { ...workshop, name: 'First', thumbnail: '' };
    request.flush(created);
    await flushCatalog([created]);
    expect(router.url).toBe(catalogUrl);
    expect(
      harness.routeNativeElement?.querySelector(
        '.workshop-card__artwork img'
      )
    ).toBeNull();
    expect(
      harness.routeNativeElement?.querySelector(
        '.workshop-card__artwork mat-icon'
      )?.textContent
    ).toBe('image');
  });

  for (const status of [403, 404, 500]) {
    it(`retains edits and permits retry after save failure ${status}`, async () => {
      const component = await openPage(true);
      component.form.controls.name.setValue('Unsaved');
      component.save();
      http
        .expectOne(editEndpoint)
        .flush({}, { status, statusText: 'Failure' });
      await harness.fixture.whenStable();
      expect(component.saving()).toBeFalse();
      expect(component.saved()).toBeFalse();
      expect(component.form.controls.name.value).toBe('Unsaved');
      expect(component.error()).toContain(
        status === 403
          ? 'administrator'
          : status === 404
            ? 'no longer exists'
            : 'Please try again'
      );
      expect(
        harness.routeNativeElement?.querySelector('[role="alert"]')
          ?.textContent
      ).toContain(component.error());
      component.save();
      http
        .expectOne(editEndpoint)
        .flush({}, { status: 500, statusText: 'Failure' });
    });
  }

  it('recovers from a failed initial read without allowing premature saves', async () => {
    const component = await harness.navigateByUrl(
      editUrl,
      CreateWorkshopComponent
    );
    component.save();
    http.expectNone(editEndpoint);
    http
      .expectOne(listEndpoint)
      .flush({}, { status: 500, statusText: 'Failure' });
    await harness.fixture.whenStable();
    expect(component.loadingWorkshop()).toBeFalse();
    expect(component.workshopLoaded()).toBeFalse();
    expect(component.error()).toContain('Could not load');
    component.retryWorkshop();
    http.expectOne(listEndpoint).flush([workshop]);
    await harness.fixture.whenStable();
    expect(component.workshopLoaded()).toBeTrue();
    expect(component.form.controls.name.value).toBe(workshop.name);
    expect(component.error()).toBe('');
  });

  it('reports a missing workshop in its section instead of editing stale state', async () => {
    const component = await harness.navigateByUrl(
      editUrl,
      CreateWorkshopComponent
    );
    http.expectOne(listEndpoint).flush([]);
    await harness.fixture.whenStable();
    expect(component.error()).toContain(
      'no longer exists in this section'
    );
    expect(component.workshopLoaded()).toBeFalse();
    component.save();
    http.expectNone(editEndpoint);
  });

  it('reports a missing section without issuing an invalid workshop request', async () => {
    const component = await harness.navigateByUrl(
      '/document-editor/missing/create-workshop',
      CreateWorkshopComponent
    );
    await harness.fixture.whenStable();
    expect(component.error()).toContain('section no longer exists');
    expect(component.workshopLoaded()).toBeFalse();
    http.expectNone(
      (r) => r.url === '/api/documents/navigation/workshops'
    );
  });

  it('resets metadata when the reused edit route changes workshop Mongo IDs', async () => {
    const component = await openPage(true);
    const other = {
      ...workshop,
      _id: 'other-id',
      name: 'Other workshop',
    };
    await harness.navigateByUrl(
      `/document-editor/${section._id}/edit-workshop/${other._id}`,
      CreateWorkshopComponent
    );
    expect(component.workshopLoaded()).toBeFalse();
    expect(component.form.controls.name.value).toBe('');
    http.expectOne(listEndpoint).flush([other]);
    await harness.fixture.whenStable();
    expect(component.form.controls.name.value).toBe('Other workshop');
  });

  it('cancels to the section catalog without a mutation', async () => {
    const component = await openPage();
    component.returnToWorkshops();
    await harness.fixture.whenStable();
    expect(router.url).toBe(catalogUrl);
    http.expectNone(createEndpoint);
    http.expectNone(editEndpoint);
  });

  it('locks confirmed saves when return navigation fails and lets the return action retry', async () => {
    const component = await openPage(true);
    const navigate = spyOn(router, 'navigate').and.resolveTo(false);
    component.save();
    http.expectOne(editEndpoint).flush(workshop);
    await harness.fixture.whenStable();
    expect(component.saved()).toBeTrue();
    expect(component.error()).toContain(
      'workshop was saved, but navigation failed'
    );
    component.save();
    http.expectNone(editEndpoint);
    component.returnToWorkshops();
    await harness.fixture.whenStable();
    expect(navigate).toHaveBeenCalledTimes(2);
  });

  for (const editing of [false, true]) {
    it(`populates the thumbnail from the modal close result (${
      editing ? 'edit' : 'create'
    })`, async () => {
      const component = await openPage(editing);
      const button = harness.routeNativeElement?.querySelector(
        'button[aria-label="Choose thumbnail image"]'
      ) as HTMLButtonElement;
      expect(button.type).toBe('button');
      expect(
        harness.routeNativeElement?.querySelector('ngx-asset-manager')
      ).toBeNull();
      const previous = component.form.controls.thumbnail.value;
      button.focus();
      button.click();
      await resolveFolder();
      expect(component.form.controls.thumbnail.value).toBe(previous);
      (
        document.querySelector(
          'button[aria-label="Select photo.png"]'
        ) as HTMLButtonElement
      ).click();
      await harness.fixture.whenStable();
      expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
      expect(component.form.controls.thumbnail.value).toBe(
        '/photo.png'
      );
      expect(component.form.controls.thumbnail.dirty).toBeTrue();
      expect(document.activeElement).toBe(button);
      expect(
        harness.routeNativeElement
          ?.querySelector('.workshop-form__image-preview')
          ?.getAttribute('src')
      ).toBe('/photo.png');
      expect(harness.routeNativeElement?.textContent).not.toContain(
        'Use for thumbnail'
      );
      component.form.patchValue({
        name: 'Workshop',
        summary: 'Summary',
      });
      component.save();
      const save = http.expectOne(
        editing ? editEndpoint : createEndpoint
      );
      expect(save.request.body.thumbnail).toBe('/photo.png');
      expect(save.request.body.thumbnail).not.toBe(asset._id);
      save.flush({}, { status: 500, statusText: 'Failure' });
      http.expectNone('/api/documents/uploader/image-upload');
    });
  }

  it('preserves manual thumbnail entry when the picker is cancelled', async () => {
    const component = await openPage(true);
    component.form.controls.thumbnail.setValue('/manual.png');
    (
      harness.routeNativeElement?.querySelector(
        'button[aria-label="Choose thumbnail image"]'
      ) as HTMLButtonElement
    ).click();
    await resolveFolder();
    (
      document.querySelector(
        'mat-dialog-actions button'
      ) as HTMLButtonElement
    ).click();
    await harness.fixture.whenStable();
    expect(component.form.controls.thumbnail.value).toBe(
      '/manual.png'
    );
    expect(component.form.controls.thumbnail.dirty).toBeFalse();
  });

  it('disables the picker while loading, saving and after confirmed save', async () => {
    const component = await harness.navigateByUrl(
      editUrl,
      CreateWorkshopComponent
    );
    const button = harness.routeNativeElement?.querySelector(
      'button[aria-label="Choose thumbnail image"]'
    ) as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
    http.expectOne(listEndpoint).flush([workshop]);
    await harness.fixture.whenStable();
    expect(button.disabled).toBeFalse();
    spyOn(router, 'navigate').and.resolveTo(false);
    component.save();
    await harness.fixture.whenStable();
    expect(button.disabled).toBeTrue();
    http.expectOne(editEndpoint).flush(workshop);
    await harness.fixture.whenStable();
    expect(button.disabled).toBeTrue();
    button.click();
    http.expectNone('/api/uploader/folders');
  });

  it('closes the picker when a reused edit route loads another workshop', async () => {
    const component = await openPage(true);
    (
      harness.routeNativeElement?.querySelector(
        'button[aria-label="Choose thumbnail image"]'
      ) as HTMLButtonElement
    ).click();
    await resolveFolder();
    const other = {
      ...workshop,
      _id: 'other',
      thumbnail: '/other.png',
    };
    await harness.navigateByUrl(
      `/document-editor/${section._id}/edit-workshop/${other._id}`,
      CreateWorkshopComponent
    );
    await harness.fixture.whenStable();
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
    http.expectOne(listEndpoint).flush([other]);
    await harness.fixture.whenStable();
    expect(component.form.controls.thumbnail.value).toBe(
      '/other.png'
    );
    expect(component.form.controls.thumbnail.dirty).toBeFalse();
  });

  for (const editing of [false, true]) {
    it(`switches the thumbnail between an image and Devicon, then saves the icon value (${
      editing ? 'edit' : 'create'
    })`, async () => {
      const component = await openPage(editing);
      const thumbnail = harness.routeNativeElement?.querySelector(
        '[formControlName="thumbnail"]'
      ) as HTMLInputElement;
      thumbnail.value = ' devicon-angular-plain colored ';
      thumbnail.dispatchEvent(new Event('input'));
      harness.detectChanges();
      expect(
        harness.routeNativeElement?.querySelector(
          '.workshop-form__image-preview'
        )
      ).toBeNull();
      expect(
        harness.routeNativeElement
          ?.querySelector('.workshop-form__icon-preview i')
          ?.classList.contains('devicon-angular-plain')
      ).toBeTrue();
      expect(
        harness.routeNativeElement
          ?.querySelector('.workshop-form__icon-preview')
          ?.getAttribute('aria-label')
      ).toBe('Workshop thumbnail preview');
      component.form.controls.thumbnail.setValue('/photo.png');
      harness.detectChanges();
      expect(
        harness.routeNativeElement
          ?.querySelector('.workshop-form__image-preview')
          ?.getAttribute('src')
      ).toBe('/photo.png');
      expect(
        harness.routeNativeElement?.querySelector(
          '.workshop-form__icon-preview'
        )
      ).toBeNull();
      component.form.controls.thumbnail.setValue('');
      harness.detectChanges();
      expect(
        harness.routeNativeElement?.querySelector(
          '.workshop-form__image-preview'
        )
      ).toBeNull();
      expect(
        harness.routeNativeElement?.querySelector(
          '.workshop-form__icon-preview'
        )
      ).toBeNull();
      component.form.patchValue({
        name: 'Icon workshop',
        summary: 'Summary',
        thumbnail: ' devicon-react-original colored ',
      });
      component.save();
      const save = http.expectOne(
        editing ? editEndpoint : createEndpoint
      );
      expect(save.request.body.thumbnail).toBe(
        'devicon-react-original colored'
      );
      const saved = {
        ...workshop,
        _id: editing ? workshop._id : 'icon-workshop',
        name: 'Icon workshop',
        thumbnail: 'devicon-react-original colored',
      };
      save.flush(saved);
      await flushCatalog([saved]);
      expect(
        harness.routeNativeElement?.querySelector(
          '.workshop-card__artwork img'
        )
      ).toBeNull();
      expect(
        harness.routeNativeElement
          ?.querySelector('.workshop-card__icon i')
          ?.classList.contains('devicon-react-original')
      ).toBeTrue();
      const reloaded = await harness.navigateByUrl(
        `/document-editor/${section._id}/edit-workshop/${saved._id}`,
        CreateWorkshopComponent
      );
      http.expectOne(listEndpoint).flush([saved]);
      await harness.fixture.whenStable();
      expect(reloaded.form.controls.thumbnail.value).toBe(
        'devicon-react-original colored'
      );
      expect(
        harness.routeNativeElement
          ?.querySelector('.workshop-form__icon-preview i')
          ?.classList.contains('devicon-react-original')
      ).toBeTrue();
    });
  }
});

describe('Workshop thumbnail delivery', () => {
  const pipe = new OptimizeCloudinaryUrlPipe();
  it('preserves uploader, manual, relative and non-image-delivery URLs', () => {
    for (const url of [
      '/photo.png',
      'https://assets.example.test/photo.png',
      'https://assets.example.test/upload/photo.png',
      'https://res.cloudinary.com/demo/video/upload/video.mp4',
      '',
    ]) {
      expect(pipe.transform(url)).toBe(url);
    }
  });

  it('retains Cloudinary image optimization', () => {
    expect(
      pipe.transform(
        'https://res.cloudinary.com/demo/image/upload/v123/photo.png'
      )
    ).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_650,q_auto:best,f_auto/v123/photo.png'
    );
  });
});
