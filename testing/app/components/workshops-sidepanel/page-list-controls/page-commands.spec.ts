import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { SectionDto, WorkshopDto } from '@tmdjr/document-contracts';
import { firstValueFrom } from 'rxjs';
import { NavigationService } from '../../../../../src/app/services/navigation.service';
import { CreatePageModalComponent } from '../../../../../src/app/components/workshops-sidepanel/page-list-controls/modals/create-page-modal/create-page-modal.component';
import { EditPageModalComponent } from '../../../../../src/app/components/workshops-sidepanel/page-list-controls/modals/edit-page-modal/edit-page-modal.component';
import { PageListComponent } from '../../../../../src/app/components/workshops-sidepanel/page-list-controls/page-list.component';

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
  _id: 'workshop',
  sectionId: 'angular',
  workshopDocumentGroupId: 'streams',
  name: 'Streams',
  summary: '',
  thumbnail: '',
  sortId: 0,
  workshopDocumentsLastUpdated: '',
  workshopDocuments: [
    { _id: 'p1', name: 'First', sortId: 0 },
    { _id: 'p2', name: 'Second', sortId: 1 },
  ],
};

describe('Page command orchestration', () => {
  let http: HttpTestingController;
  let state: NavigationService;
  let dialog: { close: jasmine.Spy; disableClose: boolean };
  beforeEach(() => {
    dialog = { close: jasmine.createSpy('close'), disableClose: false };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialog },
        { provide: MAT_DIALOG_DATA, useValue: { workshopDocument: workshop.workshopDocuments[0] } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    state = TestBed.inject(NavigationService);
    state.addSection(section);
    state.navigateToSection(section._id).subscribe();
    http.expectOne('/api/documents/navigation/workshops?section=angular').flush([workshop]);
    state.navigateToWorkshop('streams').subscribe();
  });
  afterEach(() => http.verify());

  it('blocks duplicate create submissions and restores entered values after failure', () => {
    const fixture = TestBed.createComponent(CreatePageModalComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.form.controls.name.setValue('Next');
    component.create();
    const request = http.expectOne('/api/documents/navigation/page/create-page');
    expect(request.request.body).toEqual({
      name: 'Next',
      pageType: 'PAGE',
      workshopId: 'workshop',
      sortId: 2,
    });
    expect(component.pending()).toBeTrue();
    expect(dialog.disableClose).toBeTrue();
    component.create();
    http.expectNone('/api/documents/navigation/page/create-page');
    request.flush({}, { status: 500, statusText: 'Failure' });
    fixture.detectChanges();
    expect(component.pending()).toBeFalse();
    expect(component.form.controls.name.value).toBe('Next');
    expect(component.form.enabled).toBeTrue();
    expect(dialog.disableClose).toBeFalse();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Please try again'
    );
    component.create();
    http.expectOne('/api/documents/navigation/page/create-page').flush(workshop);
    expect(dialog.close).toHaveBeenCalledTimes(1);
  });

  it('preserves an edited name on failure and applies a confirmed response without a nested refresh', async () => {
    const fixture = TestBed.createComponent(EditPageModalComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.form.controls.name.setValue('Renamed');
    component.submit();
    http
      .expectOne('/api/documents/navigation/page/edit-page-name-update-workshop')
      .flush({}, { status: 500, statusText: 'Failure' });
    expect(component.form.controls.name.value).toBe('Renamed');
    expect(dialog.close).not.toHaveBeenCalled();
    component.submit();
    const updated = {
      ...workshop,
      workshopDocuments: [{ ...workshop.workshopDocuments[0], name: 'Renamed' }],
    };
    http.expectOne('/api/documents/navigation/page/edit-page-name-update-workshop').flush(updated);
    expect(await firstValueFrom(state.getCurrentWorkshop())).toEqual(updated);
    http.expectNone('/api/documents/navigation/workshops?section=angular');
    expect(dialog.close).toHaveBeenCalledTimes(1);
  });

  it('keeps input records untouched after rejected reordering and synchronizes selection on retry', async () => {
    const fixture = TestBed.createComponent(PageListComponent);
    const items = workshop.workshopDocuments.map((item) => Object.freeze({ ...item }));
    fixture.componentRef.setInput('documents', items);
    fixture.componentRef.setInput('workshopId', workshop._id);
    fixture.componentRef.setInput('workshopDocumentGroupId', 'streams');
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.move(0, 1);
    const request = http.expectOne('/api/documents/navigation/page/sort-pages?workshopId=workshop');
    expect(request.request.body.map((item: { _id: string }) => item._id)).toEqual(['p2', 'p1']);
    component.move(0, 1);
    http.expectNone('/api/documents/navigation/page/sort-pages?workshopId=workshop');
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
    http.expectOne('/api/documents/navigation/page/sort-pages?workshopId=workshop').flush(updated);
    expect(await firstValueFrom(state.getCurrentWorkshop())).toEqual(updated);
  });
});
