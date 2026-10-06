import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SectionDto, WorkshopDto } from '@tmdjr/document-contracts';
import { firstValueFrom } from 'rxjs';
import { DocumentApiService } from '../../../src/app/services/document-api.service';
import { NavigationService } from '../../../src/app/services/navigation.service';
import { WorkshopEditorService } from '../../../src/app/services/workshops.service';

const section: SectionDto = {
  categoriesLastUpdated: '',
  _id: 'angular',
  sectionTitle: 'Angular',
  sectionDescription: '',
  summary: 0,
  menuSvgPath: '',
  headerSvgPath: '',
};
const workshop: WorkshopDto = {
  workshopDocumentsLastUpdated: '',
  _id: 'workshop-1',
  sectionId: section._id,
  name: 'Streams',
  summary: '',
  thumbnail: '',
  sortId: 0,
  workshopDocumentGroupId: 'streams',
  workshopDocuments: [
    {
      _id: 'page-1',
      kind: 'PAGE' as const,
      name: 'Intro',
      sortId: 0,
    },
  ],
};
const listUrl = `/api/documents/navigation/workshops?section=${section._id}`;

describe('Document singleton state boundary', () => {
  let http: HttpTestingController;
  let state: NavigationService;
  let commands: WorkshopEditorService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    state = TestBed.inject(NavigationService);
    commands = TestBed.inject(WorkshopEditorService);
    state.addSection(section);
  });
  afterEach(() => http.verify());

  function select(): void {
    state.navigateToSection(section._id).subscribe();
    http.expectOne(listUrl).flush([workshop]);
    state
      .navigateToWorkshop(workshop.workshopDocumentGroupId)
      .subscribe();
  }

  it('keeps HTTP access cold and independent of selection state', async () => {
    const stream = TestBed.inject(
      DocumentApiService
    ).fetchSectionWorkshops(section._id);
    http.expectNone(listUrl);
    stream.subscribe();
    http.expectOne(listUrl).flush([workshop]);
    expect(await firstValueFrom(state.getWorkshops())).toEqual([]);
    expect(
      await firstValueFrom(state.getCurrentWorkshop())
    ).toBeUndefined();
  });

  it('shares concurrent reads and expires completed entries five minutes after response', () => {
    const now = spyOn(Date, 'now').and.returnValue(1_000);
    state.navigateToSection(section._id).subscribe();
    state.navigateToSection(section._id).subscribe();
    http.expectOne(listUrl).flush([workshop]);
    now.and.returnValue(300_999);
    state.navigateToSection(section._id).subscribe();
    http.expectNone(listUrl);
    now.and.returnValue(301_000);
    state.navigateToSection(section._id).subscribe();
    http.expectOne(listUrl).flush([]);
  });

  it('retries failed reads without retaining a poisoned cache entry', () => {
    state
      .navigateToSection(section._id)
      .subscribe({ error: () => undefined });
    http
      .expectOne(listUrl)
      .flush({}, { status: 500, statusText: 'Failure' });
    state.navigateToSection(section._id).subscribe();
    http.expectOne(listUrl).flush([workshop]);
  });

  it('ignores an older response after a forced refresh completes', async () => {
    state.navigateToSection(section._id).subscribe();
    const older = http.expectOne(listUrl);
    state.navigateToSection(section._id, true).subscribe();
    const fresh = { ...workshop, name: 'Fresh' };
    http.expectOne(listUrl).flush([fresh]);
    older.flush([workshop]);
    expect(await firstValueFrom(state.getWorkshops())).toEqual([
      fresh,
    ]);
  });

  it('refreshes selected workshop references by Mongo ID, including renamed slugs', async () => {
    select();
    const renamed = {
      ...workshop,
      name: 'Renamed',
      workshopDocumentGroupId: 'renamed',
    };
    state.refreshSection(section._id).subscribe();
    http.expectOne(listUrl).flush([renamed]);
    expect(await firstValueFrom(state.getCurrentWorkshop())).toEqual(
      renamed
    );
  });

  it('merges confirmed page results and invalidates the workshop cache', async () => {
    select();
    const updated = {
      ...workshop,
      workshopDocuments: [
        ...workshop.workshopDocuments,
        {
          _id: 'page-2',
          kind: 'PAGE' as const,
          name: 'Next',
          sortId: 1,
        },
      ],
    };
    commands
      .createPage({
        workshopId: workshop._id,
        name: 'Next',
        sortId: 1,
        pageType: 'PAGE',
      })
      .subscribe();
    http
      .expectOne('/api/documents/navigation/page/create-page')
      .flush(updated);
    expect(await firstValueFrom(state.getCurrentWorkshop())).toEqual(
      updated
    );
    expect(await firstValueFrom(state.getWorkshops())).toEqual([
      updated,
    ]);
    state.navigateToSection(section._id).subscribe();
    http.expectOne(listUrl).flush([updated]);
  });

  it('preserves shared state when page mutations fail', async () => {
    select();
    commands
      .editPageName({
        _id: 'page-1',
        workshopId: workshop._id,
        name: 'Renamed',
      })
      .subscribe({ error: () => undefined });
    http
      .expectOne(
        '/api/documents/navigation/page/edit-page-name-update-workshop'
      )
      .flush({}, { status: 500, statusText: 'Failure' });
    expect(await firstValueFrom(state.getCurrentWorkshop())).toEqual(
      workshop
    );
  });

  it('removes only confirmed deleted pages from the selected workshop', async () => {
    select();
    const body = {
      _id: 'page-1',
      workshopId: workshop._id,
      name: 'Intro',
    };
    commands.deletePage(body).subscribe({ error: () => undefined });
    http
      .expectOne(
        '/api/documents/navigation/page/delete-page-and-update-workshop'
      )
      .flush({ acknowledged: true, deletedCount: 0 });
    expect(
      (await firstValueFrom(state.getCurrentWorkshop()))
        ?.workshopDocuments
    ).toEqual(workshop.workshopDocuments);
    commands.deletePage(body).subscribe();
    http
      .expectOne(
        '/api/documents/navigation/page/delete-page-and-update-workshop'
      )
      .flush({ acknowledged: true, deletedCount: 1 });
    expect(
      (await firstValueFrom(state.getCurrentWorkshop()))
        ?.workshopDocuments
    ).toEqual([]);
  });

  it('does not return to an old section when a deletion completes after navigation', async () => {
    select();
    commands.deleteWorkshop(workshop._id).subscribe();
    const deletion = http.expectOne(
      '/api/documents/navigation/workshop/delete-workshop-and-workshop-documents'
    );
    const other = { ...section, _id: 'rxjs' };
    state.addSection(other);
    state.navigateToSection(other._id).subscribe();
    const otherWorkshop = {
      ...workshop,
      _id: 'other',
      sectionId: other._id,
    };
    http
      .expectOne('/api/documents/navigation/workshops?section=rxjs')
      .flush([otherWorkshop]);
    deletion.flush({ acknowledged: true, deletedCount: 1 });
    http.expectOne(listUrl).flush([]);
    expect(await firstValueFrom(state.getCurrentSection())).toEqual(
      other
    );
    expect(await firstValueFrom(state.getWorkshops())).toEqual([
      otherWorkshop,
    ]);
  });
});
