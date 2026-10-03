import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { SectionDto } from '@tmdjr/document-contracts';
import { NavigationService } from '../../services/navigation.service';
import { SectionListComponent } from './section-list.component';
import { CreateSectionModalComponent } from './create-section-modal.component';

describe('Section authoring', () => {
  let fixture: ComponentFixture<SectionListComponent>;
  let http: HttpTestingController;
  let navigation: NavigationService;
  let dialogs: MatDialog;
  const section: SectionDto = {
    _id: '507f1f77bcf86cd799439011',
    sectionTitle: 'TypeScript',
    summary: 0,
    menuSvgPath: '',
    headerSvgPath: '',
    categoriesLastUpdated: '2026-10-03',
  };
  const endpoint = '/api/documents/navigation/section/create-section';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionListComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    navigation = TestBed.inject(NavigationService);
    dialogs = TestBed.inject(MatDialog);
    fixture = TestBed.createComponent(SectionListComponent);
    await fixture.whenStable();
  });
  afterEach(() => {
    http.verify();
    dialogs.closeAll();
  });

  async function openDialog() {
    (
      fixture.nativeElement.querySelector(
        '.header-start button'
      ) as HTMLButtonElement
    ).click();
    await fixture.whenStable();
    return dialogs.openDialogs[0]
      .componentInstance as CreateSectionModalComponent;
  }

  it('creates once, renders the new card and uses the server ID in navigation', async () => {
    expect(fixture.nativeElement.textContent).toContain(
      'No sections yet'
    );
    const dialog = await openDialog();
    const input = document.querySelector(
      'mat-dialog-container input'
    ) as HTMLInputElement;
    input.value = '  TypeScript  ';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    (
      document.querySelector(
        'mat-dialog-container form'
      ) as HTMLFormElement
    ).dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
    dialog.create(); // A second activation while pending must not send another request.
    await fixture.whenStable();
    expect(dialog.saving()).toBeTrue();
    expect(
      (
        document.querySelector(
          'button[type="submit"]'
        ) as HTMLButtonElement
      ).disabled
    ).toBeTrue();
    const req = http.expectOne(endpoint);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ sectionTitle: 'TypeScript' });
    req.flush(section);
    await fixture.whenStable();
    const link = fixture.nativeElement.querySelector(
      'a.home-row-column'
    ) as HTMLAnchorElement;
    expect(link.textContent).toContain('TypeScript');
    expect(link.getAttribute('href')).toBe(
      '/507f1f77bcf86cd799439011/workshop-list'
    );
    expect(dialogs.openDialogs.length).toBe(0);
  });
  it('shows persisted sections after fetching, including legacy links and artwork', async () => {
    navigation.fetchSections().subscribe();
    http.expectOne('/api/documents/navigation/sections').flush({
      sections: {
        [section._id]: section,
        angular: {
          ...section,
          _id: 'angular',
          sectionTitle: 'Angular',
        },
      },
    });
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelectorAll('a.home-row-column')
        .length
    ).toBe(2);
    expect(
      fixture.nativeElement.querySelector(
        'a[href="/angular/workshop-list"] svg'
      )
    ).not.toBeNull();
    navigation.navigateToSection(section._id).subscribe();
    const req = http.expectOne(
      (r) => r.url === '/api/documents/navigation/workshops'
    );
    expect(req.request.params.get('section')).toBe(section._id);
    req.flush([]);
    navigation
      .getCurrentSection()
      .subscribe((current) => expect(current?._id).toBe(section._id));
  });
  it('does not submit blank or overlong names', async () => {
    const dialog = await openDialog();
    for (const name of ['', '   ', 'a'.repeat(121)]) {
      dialog.form.controls.sectionTitle.setValue(name);
      dialog.create();
      http.expectNone(endpoint);
      expect(dialog.form.invalid).toBeTrue();
    }
  });
  it('retains input and allows retry after a failed request', async () => {
    const dialog = await openDialog();
    dialog.form.controls.sectionTitle.setValue('TypeScript');
    dialog.create();
    http
      .expectOne(endpoint)
      .flush({}, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    expect(dialog.saving()).toBeFalse();
    expect(dialogs.openDialogs[0].disableClose).toBeFalse();
    expect(dialog.form.controls.sectionTitle.value).toBe(
      'TypeScript'
    );
    expect(
      document.querySelector('[role="alert"]')?.textContent
    ).toContain('Please try again');
    dialog.create();
    http.expectOne(endpoint).flush(section);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('TypeScript');
  });
  it('explains permission denial without adding a section', async () => {
    const dialog = await openDialog();
    dialog.form.controls.sectionTitle.setValue('TypeScript');
    dialog.create();
    http
      .expectOne(endpoint)
      .flush({}, { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();
    expect(dialog.error()).toContain('administrator access');
    expect(
      fixture.nativeElement.querySelectorAll('a.home-row-column')
        .length
    ).toBe(0);
  });
  it('cancels without sending a create request', async () => {
    await openDialog();
    (
      document.querySelector(
        'mat-dialog-container button[type="button"]'
      ) as HTMLButtonElement
    ).click();
    await fixture.whenStable();
    http.expectNone(endpoint);
    expect(dialogs.openDialogs.length).toBe(0);
  });
});
