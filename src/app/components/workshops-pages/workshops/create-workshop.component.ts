import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, combineLatest, finalize, of, startWith, Subject, switchMap, take } from 'rxjs';
import { NavigationService } from '../../../services/navigation.service';
import { WorkshopEditorService } from '../../../services/workshops.service';
import { WorkshopFormComponent } from './workshop-form.component';

@Component({
  selector: 'ngx-create-workshop',
  imports: [WorkshopFormComponent],
  template: `<ngx-workshop-form
    [editing]="editing()"
    [saving]="saving()"
    [error]="error()"
    [loadingWorkshop]="loadingWorkshop()"
    [workshopLoaded]="workshopLoaded()"
    [saved]="saved()"
    [form]="form"
    (save)="save()"
    (retryWorkshop)="retryWorkshop()"
    (returnToWorkshops)="returnToWorkshops()"
    (imageSelected)="setImage($event)"
  />`,
})
export class CreateWorkshopComponent {
  private readonly editor = inject(WorkshopEditorService);
  private readonly navigation = inject(NavigationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly workshopReload = new Subject<void>();
  private readonly sectionId = signal('');
  private readonly workshopId = signal<string | null>(null);
  private readonly sortId = signal(0);
  readonly editing = computed(() => this.workshopId() !== null);
  readonly loadingWorkshop = signal(false);
  readonly workshopLoaded = signal(false);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    summary: ['', [Validators.required, Validators.pattern(/\S/)]],
    thumbnail: [''],
  });

  constructor() {
    combineLatest([this.route.paramMap, this.workshopReload.pipe(startWith(undefined))])
      .pipe(
        switchMap(([params]) => {
          const sectionId = params.get('section') ?? '';
          const workshopId = params.get('workshopId');
          this.sectionId.set(sectionId);
          this.workshopId.set(workshopId);
          this.workshopLoaded.set(false);
          this.saved.set(false);
          this.error.set('');
          this.form.reset({ name: '', summary: '', thumbnail: '' });
          this.form.controls.thumbnail.setValidators(
            workshopId === null ? [] : [Validators.required, Validators.pattern(/\S/)]
          );
          this.form.controls.thumbnail.updateValueAndValidity();
          this.loadingWorkshop.set(true);
          return this.navigation.getSections().pipe(
            take(1),
            switchMap((sections) => {
              if (!sections.some((section) => section._id === sectionId)) {
                this.error.set('This section no longer exists.');
                return of(null);
              }
              return this.navigation.navigateToSection(sectionId, true);
            }),
            catchError((error: { status?: number }) => {
              this.error.set(this.requestError(error, 'load'));
              return of(null);
            }),
            finalize(() => this.loadingWorkshop.set(false))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((workshops) => {
        if (workshops === null) return;
        const id = this.workshopId();
        this.sortId.set(workshops.length);
        if (id !== null) {
          const workshop = workshops.find((item) => item._id === id);
          if (!workshop) {
            this.error.set('This workshop no longer exists in this section.');
            return;
          }
          this.form.reset({
            name: workshop.name,
            summary: workshop.summary,
            thumbnail: workshop.thumbnail,
          });
        }
        this.workshopLoaded.set(true);
      });
  }

  retryWorkshop(): void {
    if (!this.loadingWorkshop() && !this.saving() && !this.saved()) {
      this.workshopReload.next();
    }
  }

  setImage(url: string): void {
    if (this.saving() || this.saved() || !this.workshopLoaded()) return;
    this.form.controls.thumbnail.setValue(url);
    this.form.controls.thumbnail.markAsDirty();
  }

  save(): void {
    if (this.saving() || this.saved()) return;
    if (!this.workshopLoaded()) {
      this.error.set(this.error() || 'Load the workshop details before saving.');
      return;
    }
    const values = this.form.getRawValue();
    this.form.setValue({
      name: values.name.trim(),
      summary: values.summary.trim(),
      thumbnail: values.thumbnail.trim(),
    });
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const id = this.workshopId();
    const metadata = this.form.getRawValue();
    const request =
      id === null
        ? this.editor.createWorkshop({
            ...metadata,
            sectionId: this.sectionId(),
            sortId: this.sortId(),
          })
        : this.editor.editWorkshopNameAndSummary({
            ...metadata,
            _id: id,
          });
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: ({ success }) => {
          if (!success) {
            this.error.set('The server did not confirm the workshop save. Please try again.');
            return;
          }
          this.saved.set(true);
          this.saving.set(false);
          this.returnToWorkshops();
        },
        error: (error: { status?: number }) => this.error.set(this.requestError(error, 'save')),
      });
  }

  returnToWorkshops(): void {
    if (this.saving()) return;
    const message = this.saved()
      ? 'The workshop was saved, but navigation failed. Use Back to Workshops to try again.'
      : 'Could not return to workshops. Please try again.';
    void this.router
      .navigate([this.sectionId(), 'workshop-list'], {
        relativeTo: this.route.parent,
      })
      .then(
        (navigated) => {
          if (!navigated) this.error.set(message);
        },
        () => this.error.set(message)
      );
  }

  private requestError(error: { status?: number }, action: 'load' | 'save'): string {
    if (error.status === 401 || error.status === 403) {
      return 'You need administrator access to create or edit workshops.';
    }
    if (error.status === 404) {
      return 'This workshop or section no longer exists. Your changes have not been saved.';
    }
    return action === 'load'
      ? 'Could not load the workshop details. Please try again.'
      : `Could not ${this.editing() ? 'save' : 'create'} the workshop. Please try again.`;
  }
}
