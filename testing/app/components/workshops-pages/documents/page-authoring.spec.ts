import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { HandsOnLabMongo } from '@tmdjr/coding-labs-contracts';
import {
  SectionDto,
  WorkshopDto,
  WorkshopPageDto,
} from '@tmdjr/document-contracts';
import { AssessmentTestDto } from '@tmdjr/service-nestjs-assessment-test-contracts';
import { firstValueFrom } from 'rxjs';
import { Routes } from '../../../../../src/app/app.routes';
import { CreatePageComponent } from '../../../../../src/app/components/workshops-pages/documents/create-page.component';
import { DocumentEditorComponent } from '../../../../../src/app/components/workshops-pages/documents/document-editor.component';
import { NavigationService } from '../../../../../src/app/services/navigation.service';

const section: SectionDto = {
  _id: 'angular',
  sectionTitle: 'Angular',
  sectionDescription: '',
  summary: 0,
  menuSvgPath: '',
  headerSvgPath: '',
  categoriesLastUpdated: '',
};
const workshop: WorkshopDto = {
  _id: 'mongo-workshop',
  sectionId: section._id,
  workshopDocumentGroupId: 'streams',
  name: 'Streams',
  summary: '',
  thumbnail: '',
  sortId: 0,
  workshopDocumentsLastUpdated: '',
  workshopDocuments: [
    { _id: 'p1', kind: 'PAGE' as const, name: 'First', sortId: 0 },
    { _id: 'p2', kind: 'PAGE' as const, name: 'Second', sortId: 1 },
  ],
};
const page: WorkshopPageDto = {
  _id: 'p1',
  name: 'First',
  sortId: 0,
  pageType: 'PAGE',
  html: '[]',
  workshopGroupId: workshop._id,
  lastUpdated: '',
  __v: 0,
};
const base = '/document-editor/angular/streams';
const listEndpoint =
  '/api/documents/navigation/workshops?section=angular';
const createEndpoint = '/api/documents/navigation/page/create-page';
const editEndpoint =
  '/api/documents/navigation/page/edit-page-name-update-workshop';

describe('Routed page authoring', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let router: Router;
  let state: NavigationService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([
          { path: 'document-editor', children: Routes[0].children },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    TestBed.overrideComponent(DocumentEditorComponent, {
      set: { template: '', imports: [] },
    });
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
    return harness.routeDebugElement?.query(
      By.directive(CreatePageComponent)
    ).componentInstance;
  }

  async function open(
    editing = false,
    workshops = [workshop]
  ): Promise<CreatePageComponent> {
    await harness.navigateByUrl(
      editing
        ? `${base}/edit-page/p1`
        : `${base}/create-page?returnPage=p2`
    );
    http.expectNone('/api/documents/workshop/create-page');
    http.expectNone('/api/documents/workshop/p1');
    http.expectOne(listEndpoint).flush(workshops);
    await harness.fixture.whenStable();
    return component();
  }

  function flushResourceCatalog(kind: string): void {
    if (kind === 'PAGE') return;
    harness.detectChanges();
    http
      .expectOne(
        (request) =>
          request.url ===
          (kind === 'CODING_LAB'
            ? '/api/coding-labs/labs'
            : '/api/assessment-test')
      )
      .flush([]);
  }

  async function finishReturn(
    id: string,
    name = 'First'
  ): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    http
      .expectOne(`/api/documents/workshop/${id}`)
      .flush({ ...page, _id: id, name });
    await harness.fixture.whenStable();
    expect(router.url).toBe(`${base}/${id}`);
  }

  it('moves edit to the toolbar, links both authoring pages, and leaves sidebar deletion intact', async () => {
    const navigating = harness.navigateByUrl(`${base}/p1`);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    http.expectOne('/api/documents/workshop/p1').flush(page);
    await navigating;
    await harness.fixture.whenStable();
    const toolbar = harness.routeNativeElement?.querySelector(
      '.workshop-detail__toolbar'
    );
    const edit = toolbar?.querySelector(
      '[aria-label="Edit First"]'
    ) as HTMLAnchorElement;
    const create = Array.from(
      toolbar?.querySelectorAll('a') ?? []
    ).find((link) => link.textContent?.includes('Create New Page'));
    expect(edit.getAttribute('href')).toBe(`${base}/edit-page/p1`);
    expect(create?.getAttribute('href')).toBe(
      `${base}/create-page?returnPage=p1`
    );
    expect(
      harness.routeNativeElement?.querySelector(
        'ngx-page-list [aria-label^="Edit "]'
      )
    ).toBeNull();
    expect(
      harness.routeNativeElement?.querySelector(
        'ngx-page-list [aria-label="Delete First"]'
      )
    ).not.toBeNull();
    edit.click();
    await harness.fixture.whenStable();
    http.expectOne(listEndpoint).flush([workshop]);
    await harness.fixture.whenStable();
    expect(component().form.controls.name.value).toBe('First');
    expect(TestBed.inject(MatDialog).openDialogs.length).toBe(0);
  });

  it('creates a typed page with the Mongo workshop ID and returns to its new editor', async () => {
    const vm = await open();
    expect(
      harness.routeNativeElement?.querySelector('mat-radio-group')
    ).not.toBeNull();
    vm.form.setValue({
      name: '  Next  ',
      pageType: 'PAGE',
      resourceId: '',
    });
    vm.save();
    const request = http.expectOne(createEndpoint);
    expect(request.request.body).toEqual({
      name: 'Next',
      pageType: 'PAGE',
      workshopId: workshop._id,
    });
    expect(vm.saving()).toBeTrue();
    expect(vm.form.disabled).toBeTrue();
    vm.save();
    http.expectNone(createEndpoint);
    expect(
      await router.navigateByUrl('/document-editor')
    ).toBeFalse();
    const updated = {
      ...workshop,
      workshopDocuments: [
        ...workshop.workshopDocuments,
        { _id: 'p3', kind: 'PAGE' as const, name: 'Next', sortId: 2 },
      ],
    };
    request.flush(updated);
    expect(await firstValueFrom(state.getCurrentWorkshop())).toEqual(
      updated
    );
    await finishReturn('p3', 'Next');
    http.expectNone(listEndpoint);
  });

  it('renames only metadata and returns to the same page without serializing content', async () => {
    const vm = await open(true);
    expect(vm.form.controls.name.value).toBe('First');
    expect(
      harness.routeNativeElement?.querySelector('mat-radio-group')
    ).toBeNull();
    vm.form.controls.name.setValue('  Renamed  ');
    vm.save();
    const request = http.expectOne(editEndpoint);
    expect(request.request.body).toEqual({
      _id: 'p1',
      workshopId: workshop._id,
      name: 'Renamed',
    });
    request.flush({
      ...workshop,
      workshopDocuments: [
        { ...workshop.workshopDocuments[0], name: 'Renamed' },
        workshop.workshopDocuments[1],
      ],
    });
    await finishReturn('p1', 'Renamed');
    http.expectNone('/api/documents/workshop/update-workshop-html');
    http.expectNone(listEndpoint);
  });

  for (const editing of [false, true]) {
    it(`matches the document toolbar styling on the ${
      editing ? 'edit' : 'create'
    } page`, async () => {
      await open(editing);
      const host: HTMLElement = harness.fixture.nativeElement;
      host.style.setProperty('--mat-sys-primary', 'rgb(20, 40, 60)');
      host.style.setProperty(
        '--mat-sys-on-primary',
        'rgb(240, 245, 250)'
      );
      const form = harness.routeNativeElement?.querySelector(
        'ngx-page-form'
      ) as HTMLElement;
      const toolbar = form.querySelector(
        '.page-form__toolbar'
      ) as HTMLElement;
      const content = form.querySelector('main') as HTMLElement;
      const button = toolbar.querySelector(
        'button'
      ) as HTMLButtonElement;
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
      expect(toolbar.getBoundingClientRect().width).toBe(
        form.getBoundingClientRect().width
      );
      expect(button.getAttribute('matButton')).toBe('filled');
      expect(buttonStyle.color).toBe('rgb(240, 245, 250)');
      expect(buttonStyle.backgroundColor).toBe(
        toolbarStyle.backgroundColor
      );
      expect(buttonStyle.marginLeft).toBe('12px');
      expect(buttonStyle.marginRight).toBe('12px');
    });

    it(`retains ${
      editing ? 'edited' : 'new'
    } values after denied save and supports retry`, async () => {
      const vm = await open(editing);
      vm.form.setValue({
        name: 'Changed',
        pageType: 'PAGE',
        resourceId: '',
      });
      vm.save();
      const endpoint = editing ? editEndpoint : createEndpoint;
      http
        .expectOne(endpoint)
        .flush({}, { status: 403, statusText: 'Forbidden' });
      await harness.fixture.whenStable();
      expect(vm.saving()).toBeFalse();
      expect(vm.form.enabled).toBeTrue();
      expect(vm.form.getRawValue()).toEqual({
        name: 'Changed',
        pageType: 'PAGE',
        resourceId: '',
      });
      expect(
        harness.routeNativeElement?.querySelector('[role="alert"]')
          ?.textContent
      ).toContain('administrator access');
      vm.save();
      http
        .expectOne(endpoint)
        .flush({}, { status: 500, statusText: 'Failure' });
      expect(vm.error()).toContain('Please try again');
    });

    it(`rejects blank ${
      editing ? 'edited' : 'new'
    } names without mutation`, async () => {
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
    http
      .expectOne(listEndpoint)
      .flush({}, { status: 500, statusText: 'Failure' });
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
    http
      .expectOne(listEndpoint)
      .flush([{ ...workshop, workshopDocuments: [] }]);
    await harness.fixture.whenStable();
    expect(vm.loaded()).toBeFalse();
    expect(vm.error()).toContain('page no longer exists');
  });

  it('supports empty workshops and returns cancellation to the catalog', async () => {
    const vm = await open(false, [
      { ...workshop, workshopDocuments: [] },
    ]);
    vm.form.controls.name.setValue('First');
    vm.save();
    const request = http.expectOne(createEndpoint);
    expect(request.request.body.sortId).toBeUndefined();
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
      workshopDocuments: [
        ...workshop.workshopDocuments,
        { _id: 'p3', kind: 'PAGE' as const, name: 'Next', sortId: 2 },
      ],
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

  for (const kind of ['ASSESSMENT_TEST', 'CODING_LAB'] as const) {
    it(`creates ${kind}, retains its opaque ID and opens its external view without document requests`, async () => {
      const vm = await open();
      vm.form.patchValue({ name: 'Hello example', pageType: kind });
      flushResourceCatalog(kind);
      await harness.fixture.whenStable();
      expect(harness.routeNativeElement?.textContent).toContain(
        'Assessment Test'
      );
      expect(harness.routeNativeElement?.textContent).toContain(
        'Coding Lab'
      );
      const resourceInput = harness.routeNativeElement?.querySelector(
        '[formControlName="resourceId"]'
      );
      if (kind === 'ASSESSMENT_TEST')
        expect(
          harness.routeNativeElement?.querySelector(
            'ngx-assessment-test-picker'
          )
        ).not.toBeNull();
      else
        expect(
          harness.routeNativeElement?.querySelector(
            'ngx-coding-lab-picker'
          )
        ).not.toBeNull();
      vm.form.controls.resourceId.setValue('   ');
      vm.save();
      expect(vm.form.invalid).toBeTrue();
      http.expectNone('/api/documents/navigation/page/add-reference');
      vm.form.controls.resourceId.setValue('$opaque-resource');
      vm.save();
      const request = http.expectOne(
        '/api/documents/navigation/page/add-reference'
      );
      expect(request.request.body).toEqual({
        name: 'Hello example',
        workshopId: workshop._id,
        kind,
        resourceId: '$opaque-resource',
      });
      http.expectNone(createEndpoint);
      vm.save();
      http.expectNone('/api/documents/navigation/page/add-reference');
      const entry = {
        _id: 'placement-id',
        kind,
        name: 'Hello example',
        resourceId: '$opaque-resource',
        sortId: 2,
      };
      request.flush({
        ...workshop,
        workshopDocuments: [...workshop.workshopDocuments, entry],
      });
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      await harness.fixture.whenStable();
      expect(router.url).toBe(`${base}/placement-id`);
      if (kind === 'ASSESSMENT_TEST') {
        http
          .expectOne('/api/assessment-test/%24opaque-resource')
          .flush({
            _id: 'remote-id',
            name: 'Linked test',
            subject: 'ANGULAR',
            level: 1,
            testQuestions: [],
            lastUpdated: '',
            __v: 0,
          });
        await harness.fixture.whenStable();
        expect(harness.routeNativeElement?.textContent).toContain(
          'Linked test'
        );
      } else {
        http.expectOne('/api/coding-labs/published-labs/%24opaque-resource').flush({
          labId: 'remote-id', versionId: 'version', versionNumber: 1, title: 'Linked lab',
          language: 'javascript', promptMarkdown: 'Solve the challenge', starterCode: '', hints: [], sampleTests: [],
        });
        await harness.fixture.whenStable();
        expect(harness.routeNativeElement?.textContent).toContain('Linked lab');
      }
      expect(harness.routeNativeElement?.textContent).toContain(
        'Hello example'
      );
      expect(
        harness.routeNativeElement?.querySelector(
          'ngx-document-editor'
        )
      ).toBeNull();
      http.expectNone('/api/documents/workshop/placement-id');
      http.expectNone('/api/documents/workshop/$opaque-resource');
      http.expectNone('/api/documents/workshop/update-workshop-html');
      expect(
        (
          await firstValueFrom(state.getCurrentWorkshop())
        )?.workshopDocuments?.at(-1)
      ).toEqual(entry);
    });

    it(`retains ${kind} input after a rejected reference save and clears resource validation for PAGE`, async () => {
      const vm = await open();
      vm.form.patchValue({
        name: 'Example',
        pageType: kind,
        resourceId: 'resource-id',
      });
      flushResourceCatalog(kind);
      vm.save();
      http
        .expectOne('/api/documents/navigation/page/add-reference')
        .flush({}, { status: 403, statusText: 'Forbidden' });
      expect(vm.saving()).toBeFalse();
      expect(vm.form.getRawValue()).toEqual({
        name: 'Example',
        pageType: kind,
        resourceId: 'resource-id',
      });
      expect(vm.form.enabled).toBeTrue();
      vm.form.patchValue({ pageType: 'PAGE', resourceId: '' });
      vm.save();
      const request = http.expectOne(createEndpoint);
      expect(request.request.body).toEqual({
        name: 'Example',
        pageType: 'PAGE',
        workshopId: workshop._id,
      });
      request.flush({}, { status: 500, statusText: 'Failure' });
    });

    it(`deep-links to ${kind} and renames only its workshop label`, async () => {
      const entry = {
        _id: 'external',
        kind,
        resourceId: 'remote-id',
        name: 'External label',
        sortId: 1,
      };
      const mixed = {
        ...workshop,
        workshopDocuments: [workshop.workshopDocuments[0], entry],
      };
      state.addWorkshop(mixed);
      const navigating = harness.navigateByUrl(`${base}/external`);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      http.expectOne(listEndpoint).flush([mixed]);
      await navigating;
      await harness.fixture.whenStable();
      if (kind === 'ASSESSMENT_TEST') {
        http
          .expectOne('/api/assessment-test/remote-id')
          .flush({
            _id: 'remote-id',
            name: 'Linked test',
            subject: 'ANGULAR',
            level: 1,
            testQuestions: [],
            lastUpdated: '',
            __v: 0,
          });
        await harness.fixture.whenStable();
        expect(harness.routeNativeElement?.textContent).toContain(
          'Linked test'
        );
      } else {
        http.expectOne('/api/coding-labs/published-labs/remote-id').flush({
          labId: 'remote-id', versionId: 'version', versionNumber: 1, title: 'Linked lab',
          language: 'javascript', promptMarkdown: 'Solve the challenge', starterCode: '', hints: [], sampleTests: [],
        });
        await harness.fixture.whenStable();
        expect(harness.routeNativeElement?.textContent).toContain('Linked lab');
      }
      http.expectNone('/api/documents/workshop/external');
      await harness.navigateByUrl(`${base}/edit-page/external`);
      http.expectOne(listEndpoint).flush([mixed]);
      await harness.fixture.whenStable();
      const vm = component();
      expect(vm.form.controls.pageType.value).toBe(kind);
      expect(
        harness.routeNativeElement?.querySelector(
          '[formControlName="resourceId"]'
        )
      ).toBeNull();
      vm.form.controls.name.setValue('New label');
      vm.save();
      const request = http.expectOne(editEndpoint);
      expect(request.request.body).toEqual({
        _id: 'external',
        workshopId: workshop._id,
        name: 'New label',
      });
      request.flush({
        ...mixed,
        workshopDocuments: [
          mixed.workshopDocuments[0],
          { ...entry, name: 'New label' },
        ],
      });
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      await harness.fixture.whenStable();
      expect(router.url).toBe(`${base}/external`);
      if (kind === 'ASSESSMENT_TEST') {
        http
          .expectOne('/api/assessment-test/remote-id')
          .flush({
            _id: 'remote-id',
            name: 'Linked test',
            subject: 'ANGULAR',
            level: 1,
            testQuestions: [],
            lastUpdated: '',
            __v: 0,
          });
        await harness.fixture.whenStable();
      }
      if (kind === 'CODING_LAB') {
        http.expectOne('/api/coding-labs/published-labs/remote-id').flush({
          labId: 'remote-id', versionId: 'version', versionNumber: 1, title: 'Linked lab',
          language: 'javascript', promptMarkdown: 'Solve the challenge', starterCode: '', hints: [], sampleTests: [],
        });
        await harness.fixture.whenStable();
      }
      expect(harness.routeNativeElement?.textContent).toContain(
        'New label'
      );
      http.expectNone('/api/documents/workshop/external');
    });
  }

  it('chooses a gallery lab, suggests its title, preserves custom names and submits only the selected ID', async () => {
    const vm = await open();
    vm.form.controls.pageType.setValue('CODING_LAB');
    harness.detectChanges();
    const lab: HandsOnLabMongo = {
      _id: 'catalog-lab',
      workshopId: 'other-workshop',
      slug: 'lab',
      title: 'Lab title',
      tags: [],
      status: 'published',
      createdAt: '',
      createdBy: '',
      updatedAt: '',
      updatedBy: '',
    };
    http
      .expectOne((req) => req.url === '/api/coding-labs/labs')
      .flush([lab]);
    await harness.fixture.whenStable();
    const card = harness.routeNativeElement?.querySelector(
      '.lab-gallery__card'
    ) as HTMLButtonElement;
    card.click();
    expect(vm.form.controls.resourceId.value).toBe(lab._id);
    expect(vm.form.controls.name.value).toBe(lab.title);
    vm.form.controls.name.setValue('Custom workshop label');
    vm.form.controls.name.markAsDirty();
    vm.selectCodingLab({
      ...lab,
      _id: 'second-lab',
      title: 'Second title',
    });
    expect(vm.form.controls.name.value).toBe('Custom workshop label');
    vm.save();
    const reference = http.expectOne(
      '/api/documents/navigation/page/add-reference'
    );
    expect(reference.request.body).toEqual({
      workshopId: workshop._id,
      name: 'Custom workshop label',
      kind: 'CODING_LAB',
      resourceId: 'second-lab',
    });
    vm.selectCodingLab(lab);
    expect(vm.form.controls.resourceId.value).toBe('second-lab');
    reference.flush({}, { status: 500, statusText: 'Failure' });
    vm.form.controls.pageType.setValue('ASSESSMENT_TEST');
    expect(vm.form.controls.resourceId.value).toBe('');
    expect(vm.selectedCodingLab()).toBeNull();
    flushResourceCatalog('ASSESSMENT_TEST');
  });

  it('selects an assessment, preserves custom labels, submits its test ID and clears selection on type change', async () => {
    const vm = await open();
    vm.form.controls.pageType.setValue('ASSESSMENT_TEST');
    harness.detectChanges();
    const test: AssessmentTestDto = {
      _id: 'selected-test',
      name: 'Angular assessment',
      subject: 'ANGULAR',
      level: 2,
      testQuestions: [],
      lastUpdated: '',
      __v: 0,
    };
    const catalog = http.expectOne('/api/assessment-test');
    expect(catalog.request.withCredentials).toBeTrue();
    catalog.flush([test]);
    await harness.fixture.whenStable();
    expect(
      harness.routeNativeElement?.querySelector(
        '[formControlName="resourceId"]'
      )
    ).toBeNull();
    (
      harness.routeNativeElement?.querySelector(
        '.assessment-gallery__card'
      ) as HTMLButtonElement
    ).click();
    expect(vm.form.controls.resourceId.value).toBe(test._id);
    expect(vm.form.controls.name.value).toBe(test.name);
    vm.form.controls.name.setValue('Check your understanding');
    vm.form.controls.name.markAsDirty();
    vm.selectAssessmentTest({
      ...test,
      _id: 'second-test',
      name: 'Different test',
    });
    expect(vm.form.controls.name.value).toBe(
      'Check your understanding'
    );
    vm.save();
    const mutation = http.expectOne(
      '/api/documents/navigation/page/add-reference'
    );
    expect(mutation.request.body).toEqual({
      workshopId: workshop._id,
      kind: 'ASSESSMENT_TEST',
      resourceId: 'second-test',
      name: 'Check your understanding',
    });
    vm.selectAssessmentTest(test);
    expect(vm.form.controls.resourceId.value).toBe('second-test');
    mutation.flush({}, { status: 500, statusText: 'Failure' });
    expect(vm.selectedAssessmentTest()?._id).toBe('second-test');
    vm.form.controls.pageType.setValue('CODING_LAB');
    flushResourceCatalog('CODING_LAB');
    expect(vm.form.controls.resourceId.value).toBe('');
    expect(vm.selectedAssessmentTest()).toBeNull();
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
