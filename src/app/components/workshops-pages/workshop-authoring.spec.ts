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
import { SectionDto, WorkshopDto } from '@tmdjr/document-contracts';
import { Asset, AssetManagerComponent, provideAssetManager } from '@tmdjr/ngx-asset-manager';
import { By } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { Routes } from '../../app.routes';
import { NavigationService } from '../../services/navigation.service';
import { CreateWorkshopComponent } from './create-workshop.component';
import { OptimizeCloudinaryUrlPipe } from './workshop-list.component';

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
    workshopDocuments: [{ _id: 'page-1', name: 'Introduction', sortId: 0 }],
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
  const createEndpoint = '/api/documents/navigation/workshop/create-workshop';
  const editEndpoint = '/api/documents/navigation/workshop/edit-workshop-name-and-summary';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        // The shell owns root authentication and initial section resolution.
        provideRouter([{ path: 'document-editor', children: Routes[0].children }]),
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

  afterEach(() => http.verify());

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

  async function openPage(editing = false, loadFolder = true): Promise<CreateWorkshopComponent> {
    const component = await harness.navigateByUrl(
      editing ? editUrl : createUrl,
      CreateWorkshopComponent
    );
    http.expectOne(listEndpoint).flush([workshop]);
    if (loadFolder) await resolveFolder();
    return component;
  }

  async function flushCatalog(workshops: WorkshopDto[] = [workshop]): Promise<void> {
    // Let lazy route imports resolve before flushing the section resolver.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    http.expectOne(listEndpoint).flush(workshops);
    await harness.fixture.whenStable();
  }

  it('routes the catalog create and labelled sibling edit links to dedicated pages', async () => {
    const navigationPromise = harness.navigateByUrl(catalogUrl);
    await flushCatalog();
    await navigationPromise;
    const create = Array.from(harness.routeNativeElement?.querySelectorAll('a') ?? [])
      .find((link) => link.textContent?.includes('Create New Workshop')) as HTMLAnchorElement;
    const edit = harness.routeNativeElement?.querySelector('.edit-icon') as HTMLAnchorElement;
    const editorLink = harness.routeNativeElement?.querySelector('.category-link') as HTMLAnchorElement;
    expect(create.getAttribute('href')).toBe(createUrl);
    expect(edit.getAttribute('href')).toBe(editUrl);
    expect(edit.getAttribute('aria-label')).toBe('Edit Types');
    expect(editorLink.contains(edit)).toBeFalse();
    expect(editorLink.getAttribute('href')).toBe(`/document-editor/${section._id}/types/page-1`);
    editorLink.focus();
    await harness.fixture.whenStable();
    edit.style.transition = 'none';
    expect(getComputedStyle(edit).opacity).not.toBe('0');
    edit.click();
    await harness.fixture.whenStable();
    http.expectOne(listEndpoint).flush([workshop]);
    await resolveFolder();
    expect(router.url).toBe(editUrl);
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Edit Workshop');
    http.expectNone((r) => r.url.includes('/workshop/page-1'));
  });

  it('loads a fresh workshop on direct edit, preserves IDs and submits only mutable fields', async () => {
    navigation.navigateToSection(section._id).subscribe();
    http.expectOne(listEndpoint).flush([{ ...workshop, name: 'Stale' }]);
    navigation.navigateToWorkshop(workshop.workshopDocumentGroupId).subscribe();
    const component = await openPage(true);
    expect(component.editing()).toBeTrue();
    expect(component.form.getRawValue()).toEqual({
      name: workshop.name, summary: workshop.summary, thumbnail: workshop.thumbnail,
    });
    component.form.setValue({ name: ' Renamed ', summary: ' New summary ', thumbnail: ' /photo.png ' });
    component.save();
    component.save();
    expect(component.saving()).toBeTrue();
    expect(await router.navigateByUrl('/document-editor')).toBeFalse();
    const request = http.expectOne(editEndpoint);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      _id: workshop._id, name: 'Renamed', summary: 'New summary', thumbnail: '/photo.png',
    });
    http.expectNone(createEndpoint);
    const updated = { ...workshop, name: 'Renamed', summary: 'New summary', thumbnail: '/photo.png', workshopDocumentGroupId: 'renamed' };
    request.flush(updated);
    expect((await firstValueFrom(navigation.getCurrentWorkshop()))?.name).toBe('Renamed');
    expect(await firstValueFrom(navigation.getWorkshops())).toEqual([updated]);
    await flushCatalog([updated]);
    expect(router.url).toBe(catalogUrl);
    const image = harness.routeNativeElement?.querySelector('.img-wrapper img') as HTMLImageElement;
    expect(image.getAttribute('src')).toBe('/photo.png');
    expect(harness.routeNativeElement?.querySelector('.category-link')?.getAttribute('href'))
      .toBe(`/document-editor/${section._id}/renamed/page-1`);
  });

  it('creates with section ID and count, blocks duplicate saves and returns to a fresh catalog', async () => {
    const component = await openPage();
    expect(component.editing()).toBeFalse();
    component.form.setValue({ name: ' New workshop ', summary: ' New summary ', thumbnail: '' });
    component.save();
    component.save();
    expect(await router.navigateByUrl('/document-editor')).toBeFalse();
    const request = http.expectOne(createEndpoint);
    expect(request.request.body).toEqual({
      sectionId: section._id, sortId: 1, name: 'New workshop', summary: 'New summary', thumbnail: '',
    });
    const created = { ...workshop, _id: 'new-id', name: 'New workshop', sortId: 1, thumbnail: '/photo.png', workshopDocumentGroupId: 'new-workshop' };
    request.flush(created);
    expect(await firstValueFrom(navigation.getWorkshops())).toEqual([workshop, created]);
    await flushCatalog([workshop, created]);
    expect(router.url).toBe(catalogUrl);
    expect(harness.routeNativeElement?.querySelectorAll('.ngx-mat-card').length).toBe(2);
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
    const component = await harness.navigateByUrl(createUrl, CreateWorkshopComponent);
    http.expectOne(listEndpoint).flush([]);
    await resolveFolder();
    component.form.setValue({ name: 'First', summary: 'First workshop', thumbnail: '' });
    component.save();
    const request = http.expectOne(createEndpoint);
    expect(request.request.body.sortId).toBe(0);
    expect(request.request.body.thumbnail).toBe('');
    const created = { ...workshop, name: 'First', thumbnail: '' };
    request.flush(created);
    await flushCatalog([created]);
    expect(router.url).toBe(catalogUrl);
    expect(harness.routeNativeElement?.querySelector('.img-wrapper img')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('.img-wrapper mat-icon')?.textContent).toBe('image');
  });

  for (const status of [403, 404, 500]) {
    it(`retains edits and permits retry after save failure ${status}`, async () => {
      const component = await openPage(true);
      component.form.controls.name.setValue('Unsaved');
      component.save();
      http.expectOne(editEndpoint).flush({}, { status, statusText: 'Failure' });
      await harness.fixture.whenStable();
      expect(component.saving()).toBeFalse();
      expect(component.saved()).toBeFalse();
      expect(component.form.controls.name.value).toBe('Unsaved');
      expect(component.error()).toContain(status === 403 ? 'administrator' : status === 404 ? 'no longer exists' : 'Please try again');
      expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toContain(component.error());
      component.save();
      http.expectOne(editEndpoint).flush({}, { status: 500, statusText: 'Failure' });
    });
  }

  it('recovers from a failed initial read without allowing premature saves', async () => {
    const component = await harness.navigateByUrl(editUrl, CreateWorkshopComponent);
    component.save();
    http.expectNone(editEndpoint);
    http.expectOne(listEndpoint).flush({}, { status: 500, statusText: 'Failure' });
    await resolveFolder();
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
    const component = await harness.navigateByUrl(editUrl, CreateWorkshopComponent);
    http.expectOne(listEndpoint).flush([]);
    await resolveFolder();
    expect(component.error()).toContain('no longer exists in this section');
    expect(component.workshopLoaded()).toBeFalse();
    component.save();
    http.expectNone(editEndpoint);
  });

  it('reports a missing section without issuing an invalid workshop request', async () => {
    const component = await harness.navigateByUrl('/document-editor/missing/create-workshop', CreateWorkshopComponent);
    await resolveFolder();
    expect(component.error()).toContain('section no longer exists');
    expect(component.workshopLoaded()).toBeFalse();
    http.expectNone((r) => r.url === '/api/documents/navigation/workshops');
  });

  it('resets metadata when the reused edit route changes workshop Mongo IDs', async () => {
    const component = await openPage(true);
    const other = { ...workshop, _id: 'other-id', name: 'Other workshop' };
    await harness.navigateByUrl(`/document-editor/${section._id}/edit-workshop/${other._id}`, CreateWorkshopComponent);
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
    expect(component.error()).toContain('workshop was saved, but navigation failed');
    component.save();
    http.expectNone(editEndpoint);
    component.returnToWorkshops();
    await harness.fixture.whenStable();
    expect(navigate).toHaveBeenCalledTimes(2);
  });

  it('shows folder failure with retry and never falls back to the root gallery', async () => {
    const component = await openPage(false, false);
    http.expectOne('/api/uploader/folders').flush([]);
    await harness.fixture.whenStable();
    expect(component.assetFolderError()).toContain('documents asset folder');
    expect(harness.routeNativeElement?.querySelector('ngx-asset-manager')).toBeNull();
    http.expectNone((r) => r.url === '/api/uploader');
    component.loadAssetFolder();
    await resolveFolder();
    expect(harness.routeNativeElement?.querySelector('ngx-asset-manager')).not.toBeNull();
  });

  it('keeps manual URL authoring available after denied asset-folder access', async () => {
    const component = await openPage(true, false);
    http.expectOne('/api/uploader/folders').flush({}, { status: 403, statusText: 'Forbidden' });
    await harness.fixture.whenStable();
    expect(component.assetFolderError()).toContain('permission');
    component.form.controls.thumbnail.setValue('/manual.png');
    component.save();
    const request = http.expectOne(editEndpoint);
    expect(request.request.body.thumbnail).toBe('/manual.png');
    request.flush({}, { status: 500, statusText: 'Failure' });
  });

  it('explicitly applies gallery selection and reports unusable URLs without clearing metadata', async () => {
    const component = await openPage(true);
    const picker = harness.fixture.debugElement.query(By.directive(AssetManagerComponent)).componentInstance as AssetManagerComponent;
    picker.assetSelected.emit(asset);
    expect(component.form.controls.thumbnail.value).toBe(workshop.thumbnail);
    component.useSelectedAsset();
    expect(component.form.controls.thumbnail.value).toBe('/photo.png');
    expect(component.form.controls.thumbnail.dirty).toBeTrue();
    component.selectAsset({ ...asset, storageUrl: undefined });
    component.useSelectedAsset();
    expect(component.assetSelectionError()).toContain('no usable URL');
    expect(component.form.controls.thumbnail.value).toBe('/photo.png');
    component.save();
    http.expectOne(editEndpoint).flush({}, { status: 500, statusText: 'Failure' });
  });

  it('uploads images to the documents folder and applies the returned URL, never the asset ID', async () => {
    const component = await openPage(true);
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
    const upload = Array.from(harness.routeNativeElement?.querySelectorAll('ngx-asset-upload button') ?? [])
      .find((button) => button.textContent?.includes('Upload file')) as HTMLButtonElement;
    expect(upload.disabled).toBeTrue();
    http.expectNone('/api/uploader/upload');
    setFile(new File(['image'], 'photo.png', { type: 'image/png' }));
    await harness.fixture.whenStable();
    upload.click();
    await harness.fixture.whenStable();
    const request = http.expectOne('/api/uploader/upload');
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBeTrue();
    expect((request.request.body as FormData).get('folderId')).toBe(folder._id);
    request.flush(asset);
    await harness.fixture.whenStable();
    http.expectOne('/api/uploader/folders').flush([folder]);
    http.expectOne((r) => r.url === '/api/uploader').flush([asset]);
    await harness.fixture.whenStable();
    expect(component.assetSelected()?.name).toBe('photo.png');
    expect(component.form.controls.thumbnail.value).toBe(workshop.thumbnail);
    const apply = Array.from(harness.routeNativeElement?.querySelectorAll('button') ?? [])
      .find((button) => button.textContent?.includes('Use for thumbnail')) as HTMLButtonElement;
    apply.click();
    component.save();
    const save = http.expectOne(editEndpoint);
    expect(save.request.body.thumbnail).toBe(asset.storageUrl);
    expect(save.request.body.thumbnail).not.toBe(asset._id);
    save.flush({}, { status: 500, statusText: 'Failure' });
    http.expectNone('/api/documents/uploader/image-upload');
  });
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
    expect(pipe.transform('https://res.cloudinary.com/demo/image/upload/v123/photo.png'))
      .toBe('https://res.cloudinary.com/demo/image/upload/w_650,q_auto:best,f_auto/v123/photo.png');
  });
});
