import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { SectionDto, WorkshopDto } from '@tmdjr/document-contracts';
import { firstValueFrom } from 'rxjs';
import { PageListComponent } from '../../../../../../../src/app/features/document-editor/components/workshops-sidepanel/page-list-controls/page-list.component';
import { NavigationService } from '../../../../../../../src/app/features/document-editor/state/navigation.service';

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
  level: 1,
  _id: 'workshop',
  sectionId: 'angular',
  workshopDocumentGroupId: 'streams',
  name: 'Streams',
  summary: '',
  thumbnail: '',
  sortId: 0,
  workshopDocumentsLastUpdated: '',
  workshopDocuments: [
    { _id: 'p1', kind: 'PAGE' as const, name: 'First', sortId: 0 },
    {
      _id: 'p2',
      kind: 'CODING_LAB' as const,
      resourceId: 'lab-id',
      name: 'Second',
      sortId: 1,
    },
  ],
};

describe('Page command orchestration', () => {
  let http: HttpTestingController;
  let state: NavigationService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    state = TestBed.inject(NavigationService);
    state.addSection(section);
    state.navigateToSection(section._id).subscribe();
    http
      .expectOne(
        '/api/documents/navigation/workshops?section=angular'
      )
      .flush([workshop]);
    state.navigateToWorkshop('streams').subscribe();
  });
  afterEach(() => http.verify());

  it('keeps input records untouched after rejected reordering and synchronizes selection on retry', async () => {
    const fixture = TestBed.createComponent(PageListComponent);
    const items = workshop.workshopDocuments.map((item) =>
      Object.freeze({ ...item })
    );
    fixture.componentRef.setInput('documents', items);
    fixture.componentRef.setInput('workshopId', workshop._id);
    fixture.componentRef.setInput(
      'workshopDocumentGroupId',
      'streams'
    );
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.move(0, 1);
    const request = http.expectOne(
      '/api/documents/navigation/page/sort-pages?workshopId=workshop'
    );
    expect(
      request.request.body.map((item: { _id: string }) => item._id)
    ).toEqual(['p2', 'p1']);
    expect(request.request.body[0].kind).toBe('CODING_LAB');
    expect(request.request.body[0].resourceId).toBe('lab-id');
    component.move(0, 1);
    http.expectNone(
      '/api/documents/navigation/page/sort-pages?workshopId=workshop'
    );
    request.flush({}, { status: 500, statusText: 'Failure' });
    expect(items.map((item) => item._id)).toEqual(['p1', 'p2']);
    expect(component.pending()).toBeFalse();
    component.move(0, 1);
    const updated = {
      ...workshop,
      workshopDocuments: [
        { ...items[1], sortId: 0 },
        { ...items[0], sortId: 1 },
      ],
    };
    http
      .expectOne(
        '/api/documents/navigation/page/sort-pages?workshopId=workshop'
      )
      .flush(updated);
    expect(await firstValueFrom(state.getCurrentWorkshop())).toEqual(
      updated
    );
  });
});
