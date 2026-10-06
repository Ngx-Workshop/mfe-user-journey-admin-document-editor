import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SectionDto, WorkshopDto, WorkshopPageDto } from '@tmdjr/document-contracts';
import { firstValueFrom } from 'rxjs';
import { Routes } from '../../../../../src/app/app.routes';
import { CreatePageComponent } from '../../../../../src/app/components/workshops-pages/documents/create-page.component';
import { DocumentEditorComponent } from '../../../../../src/app/components/workshops-pages/documents/document-editor.component';
import { NavigationService } from '../../../../../src/app/services/navigation.service';

const section: SectionDto = {
  _id: 'angular', sectionTitle: 'Angular', sectionDescription: '', summary: 0,
  menuSvgPath: '', headerSvgPath: '', categoriesLastUpdated: '',
};
const workshop: WorkshopDto = {
  _id: 'mongo-workshop', sectionId: section._id, workshopDocumentGroupId: 'streams',
  name: 'Streams', summary: '', thumbnail: '', sortId: 0,
  workshopDocumentsLastUpdated: '',
  workshopDocuments: [
    { _id: 'p1', name: 'First', sortId: 0 },
    { _id: 'p2', name: 'Second', sortId: 1 },
  ],
};
const page: WorkshopPageDto = {
  _id: 'p1', name: 'First', sortId: 0, pageType: 'PAGE', html: '[]',
  workshopGroupId: workshop._id, lastUpdated: '', __v: 0,
};
const base = '/document-editor/angular/streams';
const listEndpoint = '/api/documents/navigation/workshops?section=angular';
const createEndpoint = '/api/documents/navigation/page/create-page';
const editEndpoint = '/api/documents/navigation/page/edit-page-name-update-workshop';

describe('Routed page authoring', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let router: Router;
  let state: NavigationService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(), provideNoopAnimations(),
        provideRouter([{ path: 'document-editor', children: Routes[0].children }]),
        provideHttpClient(), provideHttpClientTesting(),
      ],
    });
    TestBed.overrideComponent(DocumentEditorComponent, { set: { template: '', imports: [] } });
    await TestBed.compileComponents();
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    state = TestBed.inject(NavigationService);
    state.addSection(section);
    state.navigateToSection(section._id).subscribe();
    http.expectOne(listEndpoint).flush([workshop]);
    harness = await RouterTestingHarness.create('/document-editor');
  });

  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
    http.verify();
  });

  function component(): CreatePageComponent {
    return harness.routeDebugElement?.query(By.directive(CreatePageComponent)).componentInstance;
  }

  async function open(editing = false, workshops = [workshop]): Promise<CreatePageComponent> {
    await harness.navigateByUrl(editing ? `${base}/edit-page/p1` : `${base}/create-page?returnPage=p2`);
    http.expectNone('/api/documents/workshop/create-page');
    http.expectNone('/api/documents/workshop/p1');
    http.expectOne(listEndpoint).flush(workshops);
    await harness.fixture.whenStable();
    return component();
  }

  async function finishReturn(id: string, name = 'First'): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    http.expectOne(`/api/documents/workshop/${id}`).flush({ ...page, _id: id, name });
    await harness.fixture.whenStable();
    expect(router.url).toBe(`${base}/${id}`);
  }

  it('moves edit to the toolbar, links both authoring pages, and leaves sidebar deletion intact', async () => {
    const navigating = harness.navigateByUrl(`${base}/p1`);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    http.expectOne('/api/documents/workshop/p1').flush(page);
    await navigating;
    await harness.fixture.whenStable();
    const toolbar = harness.routeNativeElement?.querySelector('.workshop-detail__toolbar');
    const edit = toolbar?.querySelector('[aria-label="Edit First"]') as HTMLAnchorElement;
    const create = Array.from(toolbar?.querySelectorAll('a') ?? [])
      .find((link) => link.textContent?.includes('Create New Page'));
    expect(edit.getAttribute('href')).toBe(`${base}/edit-page/p1`);
    expect(create?.getAttribute('href')).toBe(`${base}/create-page?returnPage=p1`);
    expect(harness.routeNativeElement?.querySelector('ngx-page-list [aria-label^="Edit "]')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('ngx-page-list [aria-label="Delete First"]')).not.toBeNull();
    edit.click();
    await harness.fixture.whenStable();
    http.expectOne(listEndpoint).flush([workshop]);
    await harness.fixture.whenStable();
    expect(component().form.controls.name.value).toBe('First');
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
  });

  it('creates a typed page with the Mongo workshop ID and returns to its new editor', async () => {
    const vm = await open();
    expect(harness.routeNativeElement?.querySelector('mat-radio-group')).not.toBeNull();
    vm.form.setValue({ name: '  Next  ', pageType: 'EXAM' });
    vm.save();
    const request = http.expectOne(createEndpoint);
    expect(request.request.body).toEqual({
      name: 'Next', pageType: 'EXAM', workshopId: workshop._id, sortId: 2,
    });
    expect(vm.saving()).toBeTrue();
    expect(vm.form.disabled).toBeTrue();
    vm.save();
    http.expectNone(createEndpoint);
    expect(await router.navigateByUrl('/document-editor')).toBeFalse();
    const updated = {
      ...workshop,
      workshopDocuments: [...workshop.workshopDocuments, { _id: 'p3', name: 'Next', sortId: 2 }],
    };
    request.flush(updated);
    expect(await firstValueFrom(state.getCurrentWorkshop())).toEqual(updated);
    await finishReturn('p3', 'Next');
    http.expectNone(listEndpoint);
  });

  it('renames only metadata and returns to the same page without serializing content', async () => {
    const vm = await open(true);
    expect(vm.form.controls.name.value).toBe('First');
    expect(harness.routeNativeElement?.querySelector('mat-radio-group')).toBeNull();
    vm.form.controls.name.setValue('  Renamed  ');
    vm.save();
    const request = http.expectOne(editEndpoint);
    expect(request.request.body).toEqual({
      _id: 'p1', workshopId: workshop._id, name: 'Renamed',
    });
    request.flush({
      ...workshop,
      workshopDocuments: [{ ...workshop.workshopDocuments[0], name: 'Renamed' }, workshop.workshopDocuments[1]],
    });
    await finishReturn('p1', 'Renamed');
    http.expectNone('/api/documents/workshop/update-workshop-html');
    http.expectNone(listEndpoint);
  });

  for (const editing of [false, true]) {
    it(`matches the document toolbar styling on the ${editing ? 'edit' : 'create'} page`, async () => {
      await open(editing);
      const host: HTMLElement = harness.fixture.nativeElement;
      host.style.setProperty('--mat-sys-primary', 'rgb(20, 40, 60)');
      host.style.setProperty('--mat-sys-on-primary', 'rgb(240, 245, 250)');
      const form = harness.routeNativeElement?.querySelector('ngx-page-form') as HTMLElement;
      const toolbar = form.querySelector('.page-form__toolbar') as HTMLElement;
      const content = form.querySelector('main') as HTMLElement;
      const button = toolbar.querySelector('button') as HTMLButtonElement;
      const toolbarStyle = getComputedStyle(toolbar);
      const buttonStyle = getComputedStyle(button);
      expect(toolbar.parentElement).toBe(form);
      expect(content.contains(toolbar)).toBeFalse();
      expect(toolbarStyle.position).toBe('sticky');
      expect(toolbarStyle.top).toBe('56px');
      expect(toolbarStyle.minHeight).toBe('56px');
      expect(toolbarStyle.zIndex).toBe('5');
      expect(toolbarStyle.display).toBe('flex');
      expect(toolbarStyle.flexWrap).toBe('wrap');
      expect(toolbarStyle.backgroundColor).toBe('rgb(20, 40, 60)');
      expect(toolbar.getBoundingClientRect().width).toBe(form.getBoundingClientRect().width);
      expect(button.getAttribute('matButton')).toBe('filled');
      expect(buttonStyle.color).toBe('rgb(240, 245, 250)');
      expect(buttonStyle.backgroundColor).toBe(toolbarStyle.backgroundColor);
      expect(buttonStyle.marginLeft).toBe('12px');
      expect(buttonStyle.marginRight).toBe('12px');
    });

    it(`retains ${editing ? 'edited' : 'new'} values after denied save and supports retry`, async () => {
      const vm = await open(editing);
      vm.form.setValue({ name: 'Changed', pageType: 'EXAM' });
      vm.save();
      const endpoint = editing ? editEndpoint : createEndpoint;
      http.expectOne(endpoint).flush({}, { status: 403, statusText: 'Forbidden' });
      await harness.fixture.whenStable();
      expect(vm.saving()).toBeFalse();
      expect(vm.form.enabled).toBeTrue();
      expect(vm.form.getRawValue()).toEqual({ name: 'Changed', pageType: 'EXAM' });
      expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent)
        .toContain('administrator access');
      vm.save();
      http.expectOne(endpoint).flush({}, { status: 500, statusText: 'Failure' });
      expect(vm.error()).toContain('Please try again');
    });

    it(`rejects blank ${editing ? 'edited' : 'new'} names without mutation`, async () => {
      const vm = await open(editing);
      vm.form.controls.name.setValue('   ');
      vm.save();
      expect(vm.form.invalid).toBeTrue();
      expect(vm.form.touched).toBeTrue();
      http.expectNone(createEndpoint);
      http.expectNone(editEndpoint);
    });
  }

  it('cancels creation back to the originating page without mutating data', async () => {
    const vm = await open();
    vm.form.controls.name.setValue('Unsaved');
    vm.returnToWorkshop();
    await finishReturn('p2', 'Second');
    http.expectNone(createEndpoint);
  });

  it('recovers a failed fresh read and never permits saving stale selection', async () => {
    await harness.navigateByUrl(`${base}/edit-page/p1`);
    const vm = component();
    expect(vm.loading()).toBeTrue();
    vm.save();
    http.expectNone(editEndpoint);
    http.expectOne(listEndpoint).flush({}, { status: 500, statusText: 'Failure' });
    await harness.fixture.whenStable();
    expect(vm.loaded()).toBeFalse();
    expect(vm.error()).toContain('Could not load');
    vm.retry();
    http.expectOne(listEndpoint).flush([workshop]);
    await harness.fixture.whenStable();
    expect(vm.loaded()).toBeTrue();
    expect(vm.form.controls.name.value).toBe('First');
  });

  it('reports a missing workshop or page instead of saving against the previous selection', async () => {
    const vm = await open(true, []);
    expect(vm.loaded()).toBeFalse();
    expect(vm.error()).toContain('workshop no longer exists');
    vm.save();
    http.expectNone(editEndpoint);
    vm.retry();
    http.expectOne(listEndpoint).flush([{ ...workshop, workshopDocuments: [] }]);
    await harness.fixture.whenStable();
    expect(vm.loaded()).toBeFalse();
    expect(vm.error()).toContain('page no longer exists');
  });

  it('supports empty workshops and returns cancellation to the catalog', async () => {
    const vm = await open(false, [{ ...workshop, workshopDocuments: [] }]);
    vm.form.controls.name.setValue('First');
    vm.save();
    const request = http.expectOne(createEndpoint);
    expect(request.request.body.sortId).toBe(0);
    request.flush({}, { status: 500, statusText: 'Failure' });
    vm.returnToWorkshop();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/document-editor/angular/workshop-list');
  });

  it('retains confirmed save state when return navigation fails and prevents duplicate creation', async () => {
    const vm = await open();
    vm.form.controls.name.setValue('Next');
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(false));
    vm.save();
    http.expectOne(createEndpoint).flush({
      ...workshop,
      workshopDocuments: [...workshop.workshopDocuments, { _id: 'p3', name: 'Next', sortId: 2 }],
    });
    await harness.fixture.whenStable();
    expect(vm.saved()).toBeTrue();
    expect(vm.error()).toContain('saved, but navigation failed');
    vm.save();
    http.expectNone(createEndpoint);
    vm.returnToWorkshop();
    expect(router.navigate).toHaveBeenCalledTimes(2);
  });

  it('does not invite duplicate creation when a confirmed response omits the new page reference', async () => {
    const vm = await open();
    vm.form.controls.name.setValue('Next');
    vm.save();
    http.expectOne(createEndpoint).flush(workshop);
    expect(vm.saved()).toBeTrue();
    expect(vm.error()).toContain('its link was not returned');
    vm.save();
    http.expectNone(createEndpoint);
  });

  it('loads the new page when the edit route is reused', async () => {
    const vm = await open(true);
    await harness.navigateByUrl(`${base}/edit-page/p2`);
    http.expectOne(listEndpoint).flush([workshop]);
    await harness.fixture.whenStable();
    expect(component()).toBe(vm);
    expect(vm.form.controls.name.value).toBe('Second');
    vm.form.controls.name.setValue('Second renamed');
    vm.save();
    const request = http.expectOne(editEndpoint);
    expect(request.request.body._id).toBe('p2');
    request.flush({}, { status: 500, statusText: 'Failure' });
  });
});
