import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SectionDto, WorkshopDto } from '@tmdjr/document-contracts';
import { firstValueFrom } from 'rxjs';
import { Routes } from '../../../../../src/app/app.routes';
import { NavigationService } from '../../../../../src/app/services/navigation.service';
import { DeleteSectionModalComponent } from '../../../../../src/app/components/workshops-pages/sections/delete-section-modal.component';

describe('Section deletion', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let dialogs: MatDialog;
  let navigation: NavigationService;
  let router: Router;
  const section: SectionDto = {
    _id: '507f1f77bcf86cd799439011',
    sectionTitle: 'TypeScript',
    sectionDescription: 'Typed workshops',
    summary: 0,
    menuSvgPath: '',
    headerSvgPath: '',
    categoriesLastUpdated: '',
  };
  const other: SectionDto = { ...section, _id: 'other-section', sectionTitle: 'Other' };
  const endpoint = `/api/documents/navigation/section/${section._id}`;
  const workshopsEndpoint = '/api/documents/navigation/workshops';
  const staleWorkshop: WorkshopDto = {
    _id: 'workshop-id',
    sectionId: section._id,
    name: 'Types',
    summary: '',
    thumbnail: '',
    sortId: 0,
    workshopDocumentGroupId: 'types',
    workshopDocuments: [],
    workshopDocumentsLastUpdated: '',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        // Root authentication and initial section resolution are shell-owned.
        provideRouter([{ path: 'document-editor', children: Routes[0].children }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    dialogs = TestBed.inject(MatDialog);
    navigation = TestBed.inject(NavigationService);
    router = TestBed.inject(Router);
    navigation.addSection(section);
    navigation.addSection(other);
    harness = await RouterTestingHarness.create('/document-editor');
  });

  afterEach(async () => {
    dialogs.closeAll();
    await harness.fixture.whenStable();
    http.verify();
  });

  async function openDelete(target = section): Promise<MatDialogRef<DeleteSectionModalComponent, boolean>> {
    const button = harness.routeNativeElement?.querySelector(
      `button[aria-label="Delete ${target.sectionTitle}"]`
    ) as HTMLButtonElement;
    button.focus();
    button.click();
    await harness.fixture.whenStable();
    return dialogs.openDialogs[0];
  }

  async function enterName(name = section.sectionTitle): Promise<void> {
    const input = document.querySelector('mat-dialog-container input') as HTMLInputElement;
    input.value = name;
    input.dispatchEvent(new Event('input'));
    await harness.fixture.whenStable();
  }

  function submit(): HTMLButtonElement {
    return document.querySelector('mat-dialog-container button[type="submit"]') as HTMLButtonElement;
  }

  it('opens the section-specific dialog for the selected card without opening workshops', async () => {
    const button = harness.routeNativeElement?.querySelector(
      `button[aria-label="Delete ${other.sectionTitle}"]`
    ) as HTMLButtonElement;
    const card = button.closest('.section-card') as HTMLElement;
    expect(card.querySelector('.section-card__link')?.contains(button)).toBeFalse();
    const ref = await openDelete(other);
    expect(ref.componentInstance).toBeInstanceOf(DeleteSectionModalComponent);
    expect(ref.componentInstance.section).toEqual(other);
    expect(document.querySelector('mat-dialog-container h2')?.textContent).toBe('Delete Other?');
    expect(document.querySelector('mat-dialog-container')?.textContent).toContain('Only empty sections');
    expect(document.querySelector('mat-dialog-container')?.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(document.querySelector('mat-dialog-container input'));
    expect(router.url).toBe('/document-editor');
    http.expectNone(workshopsEndpoint);
    http.expectNone((r) => r.method === 'DELETE');
  });

  it('requires exact case-sensitive title entry and prevents programmatic invalid submission', async () => {
    const ref = await openDelete();
    for (const name of ['', 'typescript', 'TypeScript ', other.sectionTitle]) {
      await enterName(name);
      expect(submit().disabled).toBeTrue();
      ref.componentInstance.deleteSection();
      expect(ref.componentInstance.form.touched).toBeTrue();
      http.expectNone(endpoint);
    }
    await enterName();
    expect(submit().disabled).toBeFalse();
    http.expectNone(endpoint);
  });

  for (const method of ['cancel', 'escape', 'backdrop'] as const) {
    it(`cancels via ${method} without deletion and restores the origin's focus`, async () => {
      const origin = harness.routeNativeElement?.querySelector(
        `button[aria-label="Delete ${section.sectionTitle}"]`
      ) as HTMLButtonElement;
      await openDelete();
      await enterName();
      if (method === 'cancel') {
        (document.querySelector('mat-dialog-actions button[type="button"]') as HTMLButtonElement).click();
      } else if (method === 'escape') {
        (document.querySelector('mat-dialog-container') as HTMLElement).dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true })
        );
      } else {
        (document.querySelector('.cdk-overlay-backdrop') as HTMLElement).click();
      }
      await harness.fixture.whenStable();
      expect(dialogs.openDialogs.length).toBe(0);
      expect(document.activeElement).toBe(origin);
      expect(harness.routeNativeElement?.querySelectorAll('.section-card').length).toBe(2);
      http.expectNone((r) => r.method === 'DELETE');
    });
  }

  it('sends one DELETE without a body, blocks pending dismissal and removes only confirmed state', async () => {
    const ref = await openDelete();
    const component = ref.componentInstance;
    const results: Array<boolean | undefined> = [];
    ref.afterClosed().subscribe((result) => results.push(result));
    await enterName();
    submit().click();
    component.deleteSection();
    const request = http.expectOne(endpoint);
    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toBeNull();
    await harness.fixture.whenStable();
    expect(ref.componentInstance.saving()).toBeTrue();
    expect(ref.disableClose).toBeTrue();
    expect(submit().disabled).toBeTrue();
    expect(document.querySelector('mat-dialog-container input')?.matches(':disabled')).toBeTrue();
    expect((document.querySelector('mat-dialog-actions button[type="button"]') as HTMLButtonElement).disabled).toBeTrue();
    (document.querySelector('mat-dialog-container') as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true })
    );
    (document.querySelector('.cdk-overlay-backdrop') as HTMLElement).click();
    await harness.fixture.whenStable();
    expect(dialogs.openDialogs.length).toBe(1);
    expect(await firstValueFrom(navigation.getSections())).toEqual([section, other]);
    request.flush({ acknowledged: true, deletedCount: 1 });
    await harness.fixture.whenStable();
    expect(results).toEqual([true]);
    expect(dialogs.openDialogs.length).toBe(0);
    expect(await firstValueFrom(navigation.getSections())).toEqual([other]);
    expect(harness.routeNativeElement?.querySelectorAll('.section-card').length).toBe(1);
    expect(harness.routeNativeElement?.textContent).not.toContain(section.sectionTitle);
    expect(router.url).toBe('/document-editor');
    component.deleteSection();
    http.expectNone(endpoint);
    http.expectNone('/api/documents/navigation/sections');
    http.expectNone('/api/documents/navigation/workshop/delete-workshop-and-workshop-documents');
  });

  for (const [status, message] of [
    [400, 'identifier is invalid'],
    [401, 'administrator access'],
    [403, 'administrator access'],
    [404, 'no longer exists'],
    [409, 'contains workshops'],
    [500, 'Could not delete'],
  ] as const) {
    it(`retains state/name and permits retry after HTTP ${status}`, async () => {
      const ref = await openDelete();
      await enterName();
      submit().click();
      http.expectOne(endpoint).flush({}, { status, statusText: 'Rejected' });
      await harness.fixture.whenStable();
      expect(ref.componentInstance.saving()).toBeFalse();
      expect(ref.disableClose).toBeFalse();
      expect(ref.componentInstance.deleted()).toBeFalse();
      expect(ref.componentInstance.form.controls.sectionTitle.value).toBe(section.sectionTitle);
      expect(ref.componentInstance.error()).toContain(message);
      expect(document.querySelector('[role="alert"]')?.textContent).toContain(message);
      expect(await firstValueFrom(navigation.getSections())).toEqual([section, other]);
      expect(submit().disabled).toBeFalse();
      submit().click();
      expect(ref.componentInstance.error()).toBe('');
      http.expectOne(endpoint).flush({ acknowledged: true, deletedCount: 1 });
      await harness.fixture.whenStable();
      expect(dialogs.openDialogs.length).toBe(0);
      expect(await firstValueFrom(navigation.getSections())).toEqual([other]);
      http.expectNone('/api/documents/navigation/workshop/delete-workshop-and-workshop-documents');
    });
  }

  for (const result of [
    null,
    { acknowledged: 'true', deletedCount: 1 },
    { acknowledged: false, deletedCount: 1 },
    { acknowledged: true, deletedCount: 0 },
    { acknowledged: true, deletedCount: 2 },
  ]) {
    it(`rejects an unconfirmed result ${JSON.stringify(result)}`, async () => {
      const ref = await openDelete();
      await enterName();
      submit().click();
      http.expectOne(endpoint).flush(result);
      await harness.fixture.whenStable();
      expect(ref.componentInstance.error()).toContain('did not confirm');
      expect(ref.componentInstance.saving()).toBeFalse();
      expect(ref.componentInstance.deleted()).toBeFalse();
      expect(await firstValueFrom(navigation.getSections())).toEqual([section, other]);
      expect(dialogs.openDialogs.length).toBe(1);
    });
  }

  it('supports a legacy section key and removes the final section into the catalog empty state', async () => {
    navigation.removeSection(section._id);
    navigation.removeSection(other._id);
    const legacy = { ...section, _id: 'angular', sectionTitle: 'Angular' };
    navigation.addSection(legacy);
    await harness.fixture.whenStable();
    await openDelete(legacy);
    await enterName(legacy.sectionTitle);
    submit().click();
    const request = http.expectOne('/api/documents/navigation/section/angular');
    expect(request.request.method).toBe('DELETE');
    request.flush({ acknowledged: true, deletedCount: 1 });
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.querySelectorAll('.section-card').length).toBe(0);
    expect(harness.routeNativeElement?.textContent).toContain('No sections yet.');
  });

  it('clears selected deleted-section state and invalidates its stale workshop cache', async () => {
    navigation.navigateToSection(section._id).subscribe();
    http.expectOne((r) => r.url === workshopsEndpoint).flush([staleWorkshop]);
    navigation.navigateToWorkshop(staleWorkshop.workshopDocumentGroupId).subscribe();
    await openDelete();
    await enterName();
    submit().click();
    http.expectOne(endpoint).flush({ acknowledged: true, deletedCount: 1 });
    await harness.fixture.whenStable();
    expect(await firstValueFrom(navigation.getCurrentSection())).toBeUndefined();
    expect(await firstValueFrom(navigation.getCurrentWorkshop())).toBeUndefined();
    expect(await firstValueFrom(navigation.getWorkshops())).toEqual([]);
    navigation.navigateToSection(section._id).subscribe();
    const reload = http.expectOne((r) => r.url === workshopsEndpoint);
    expect(reload.request.params.get('section')).toBe(section._id);
    reload.flush([]);
  });

  it('preserves unrelated selected workshops and their cached reads', async () => {
    navigation.navigateToSection(section._id).subscribe();
    http.expectOne((r) => r.url === workshopsEndpoint).flush([]);
    const otherWorkshop = { ...staleWorkshop, _id: 'other-workshop', sectionId: other._id };
    navigation.navigateToSection(other._id).subscribe();
    http.expectOne((r) => r.url === workshopsEndpoint).flush([otherWorkshop]);
    navigation.navigateToWorkshop(otherWorkshop.workshopDocumentGroupId).subscribe();
    await openDelete();
    await enterName();
    submit().click();
    http.expectOne(endpoint).flush({ acknowledged: true, deletedCount: 1 });
    await harness.fixture.whenStable();
    expect(await firstValueFrom(navigation.getCurrentSection())).toEqual(other);
    expect(await firstValueFrom(navigation.getCurrentWorkshop())).toEqual(otherWorkshop);
    expect(await firstValueFrom(navigation.getWorkshops())).toEqual([otherWorkshop]);
    navigation.navigateToSection(other._id).subscribe();
    http.expectNone((r) => r.url === workshopsEndpoint);
    expect(await firstValueFrom(navigation.getWorkshops())).toEqual([otherWorkshop]);
  });
});
