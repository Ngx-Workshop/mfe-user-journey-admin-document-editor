import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkshopDto } from '@tmdjr/document-contracts';
import { catchError, combineLatest, finalize, map, of, startWith, Subject, switchMap } from 'rxjs';
import { NavigationService } from '../../../services/navigation.service';
import { WorkshopEditorService } from '../../../services/workshops.service';
import { PageFormComponent } from './page-form.component';

@Component({
  selector: 'ngx-create-page',
  imports: [PageFormComponent],
  template: `<ngx-page-form [form]="form" [editing]="editing()" [loading]="loading()"
    [loaded]="loaded()" [saving]="saving()" [saved]="saved()" [error]="error()"
    (save)="save()" (back)="returnToWorkshop()" (retry)="retry()" />`,
})
export class CreatePageComponent {
  private readonly navigation = inject(NavigationService);
  private readonly editor = inject(WorkshopEditorService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload = new Subject<void>();
  private sectionId = '';
  private workshopSlug = '';
  private workshop: WorkshopDto | null = null;
  private returnPageId = '';
  private readonly pageId = signal<string | null>(null);
  readonly editing = computed(() => this.pageId() !== null);
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    pageType: ['PAGE' as 'PAGE' | 'EXAM', Validators.required],
  });

  constructor() {
    combineLatest([
      combineLatest(this.route.pathFromRoot.map((route) => route.paramMap)),
      this.reload.pipe(startWith(undefined)),
    ]).pipe(
      switchMap(([params]) => {
        this.sectionId = params.find((value) => value.has('section'))?.get('section') ?? '';
        this.workshopSlug = params.find((value) => value.has('workshopId'))?.get('workshopId') ?? '';
        this.pageId.set(this.route.snapshot.paramMap.get('documentId'));
        this.returnPageId = this.pageId() ?? this.route.snapshot.queryParamMap.get('returnPage') ?? '';
        this.workshop = null;
        this.loaded.set(false);
        this.saved.set(false);
        this.error.set('');
        this.form.reset({ name: '', pageType: 'PAGE' });
        this.form.disable();
        this.loading.set(true);
        return this.navigation.navigateToSection(this.sectionId, true).pipe(
          switchMap((workshops) => {
            const workshop = workshops.find((item) =>
              item.workshopDocumentGroupId === this.workshopSlug);
            if (!workshop) {
              this.error.set('This workshop no longer exists in this section.');
              return of(null);
            }
            return this.navigation.navigateToWorkshop(this.workshopSlug).pipe(map(() => workshop));
          }),
          catchError((error: { status?: number }) => {
            this.error.set(this.requestError(error, 'load'));
            return of(null);
          }),
          finalize(() => this.loading.set(false))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((workshop) => {
      if (!workshop) return;
      this.workshop = workshop;
      const id = this.pageId();
      if (id !== null) {
        const page = workshop.workshopDocuments.find((item) => item._id === id);
        if (!page) {
          this.error.set('This page no longer exists in this workshop.');
          return;
        }
        this.form.controls.name.setValue(page.name);
      }
      this.loaded.set(true);
      this.form.enable();
    });
  }

  retry(): void {
    if (!this.loading() && !this.saving() && !this.saved()) this.reload.next();
  }

  save(): void {
    if (this.saving() || this.saved()) return;
    const workshop = this.workshop;
    if (!this.loaded() || !workshop) {
      this.error.set(this.error() || 'Load the page details before saving.');
      return;
    }
    this.form.controls.name.setValue(this.form.controls.name.value.trim());
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.form.disable();
    const id = this.pageId();
    const request = id === null
      ? this.editor.createPage({
          ...this.form.getRawValue(),
          workshopId: workshop._id,
          sortId: workshop.workshopDocuments.length,
        })
      : this.editor.editPageName({
          _id: id, workshopId: workshop._id, name: this.form.getRawValue().name,
        });
    request.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.saving.set(false);
        if (!this.saved()) this.form.enable();
      })
    ).subscribe({
      next: ({ success }) => {
        if (!success) {
          this.error.set('The server did not confirm the page save. Please try again.');
          return;
        }
        this.saved.set(true);
        this.saving.set(false);
        this.workshop = success;
        this.workshopSlug = success.workshopDocumentGroupId;
        const destination = id ?? success.workshopDocuments.find((page) =>
          !workshop.workshopDocuments.some((previous) => previous._id === page._id))?._id;
        if (!destination) {
          this.error.set('The page was saved, but its link was not returned. Return to the workshop to continue.');
          return;
        }
        this.returnPageId = destination;
        this.returnToWorkshop();
      },
      error: (error: { status?: number }) => this.error.set(this.requestError(error, 'save')),
    });
  }

  returnToWorkshop(): void {
    if (this.saving()) return;
    const pages = [...(this.workshop?.workshopDocuments ?? [])].sort((a, b) => a.sortId - b.sortId);
    const page = pages.find((item) => item._id === this.returnPageId) ?? pages[0];
    const commands = page
      ? [this.workshopSlug, page._id]
      : ['workshop-list'];
    const sectionRoute = this.route.parent?.parent;
    const message = this.saved()
      ? 'The page was saved, but navigation failed. Use Back to Workshop to try again.'
      : 'Could not return to the workshop. Please try again.';
    void this.router.navigate(commands, { relativeTo: sectionRoute }).then(
      (navigated) => { if (!navigated) this.error.set(message); },
      () => this.error.set(message)
    );
  }

  private requestError(error: { status?: number }, action: 'load' | 'save'): string {
    if (error.status === 401 || error.status === 403) {
      return 'You need administrator access to create or edit pages.';
    }
    if (error.status === 404) {
      return 'This page or workshop no longer exists. Your changes have not been saved.';
    }
    return action === 'load'
      ? 'Could not load the page details. Please try again.'
      : 'Could not save the page. Please try again.';
  }
}
