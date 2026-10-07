import {
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  catchError,
  combineLatest,
  finalize,
  of,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';
import { WorkshopEditorService } from '../../state/workshops.service';
import { SectionFormComponent } from './section-form.component';

@Component({
  selector: 'ngx-create-section',
  imports: [SectionFormComponent],
  template: `<ngx-section-form
    [editing]="editing()"
    [saving]="saving()"
    [error]="error()"
    [loadingSection]="loadingSection()"
    [sectionLoaded]="sectionLoaded()"
    [created]="created()"
    [form]="form"
    (create)="create()"
    (retrySection)="retrySection()"
    (returnToSections)="returnToSections()"
    (imageSelected)="setImage($event.field, $event.url)"
  />`,
})
export class CreateSectionComponent {
  private readonly editor = inject(WorkshopEditorService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sectionReload = new Subject<void>();
  private readonly sectionId = signal<string | null>(null);
  readonly editing = computed(() => this.sectionId() !== null);
  readonly loadingSection = signal(false);
  readonly sectionLoaded = signal(false);
  readonly saving = signal(false);
  readonly created = signal(false);
  readonly error = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    sectionTitle: [
      '',
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(120),
      ],
    ],
    sectionDescription: [''],
    menuSvgPath: [''],
    headerSvgPath: [''],
  });

  constructor() {
    combineLatest([
      this.route.paramMap,
      this.sectionReload.pipe(startWith(undefined)),
    ])
      .pipe(
        switchMap(([params]) => {
          const id = params.get('sectionId');
          this.sectionId.set(id);
          this.sectionLoaded.set(false);
          this.created.set(false);
          this.error.set('');
          this.form.reset({
            sectionTitle: '',
            sectionDescription: '',
            menuSvgPath: '',
            headerSvgPath: '',
          });
          if (id === null) return of(null);
          this.loadingSection.set(true);
          return this.editor.getSection(id).pipe(
            catchError((error: { status?: number }) => {
              this.error.set(
                error.status === 404
                  ? 'This section no longer exists.'
                  : error.status === 401 || error.status === 403
                    ? 'You need administrator access to edit a section.'
                    : 'Could not load the section. Please try again.'
              );
              return of(null);
            }),
            finalize(() => this.loadingSection.set(false))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((section) => {
        if (!section) return;
        this.form.reset({
          sectionTitle: section.sectionTitle,
          sectionDescription: section.sectionDescription,
          menuSvgPath: section.menuSvgPath,
          headerSvgPath: section.headerSvgPath,
        });
        this.sectionLoaded.set(true);
      });
  }

  retrySection(): void {
    if (!this.loadingSection() && !this.saving() && !this.created()) {
      this.sectionReload.next();
    }
  }

  create(): void {
    if (this.saving() || this.created()) return;
    if (this.editing() && !this.sectionLoaded()) {
      this.error.set(
        this.error() || 'Load the section before saving changes.'
      );
      return;
    }
    this.form.controls.sectionTitle.setValue(
      this.form.controls.sectionTitle.value.trim()
    );
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const values = {
      ...this.form.getRawValue(),
      sectionDescription:
        this.form.controls.sectionDescription.value.trim(),
      menuSvgPath: this.form.controls.menuSvgPath.value.trim(),
      headerSvgPath: this.form.controls.headerSvgPath.value.trim(),
    };
    const id = this.sectionId();
    const request =
      id === null
        ? this.editor.createSection(values)
        : this.editor.updateSection(id, values);
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: (section) => {
          this.created.set(true);
          this.saving.set(false);
          this.returnToSections();
        },
        error: (error: { status?: number }) =>
          this.error.set(
            error.status === 401 || error.status === 403
              ? `You need administrator access to ${
                  this.editing() ? 'edit' : 'create'
                } a section.`
              : error.status === 404 && this.editing()
                ? 'This section no longer exists. Your changes have not been saved.'
                : `Could not ${
                    this.editing() ? 'save' : 'create'
                  } the section. Please try again.`
          ),
      });
  }

  setImage(
    field: 'menuSvgPath' | 'headerSvgPath',
    url: string
  ): void {
    if (
      this.saving() ||
      this.created() ||
      (this.editing() && !this.sectionLoaded())
    )
      return;
    this.form.controls[field].setValue(url);
    this.form.controls[field].markAsDirty();
  }

  returnToSections(): void {
    if (this.saving()) return;
    const message = this.created()
      ? `The section was ${
          this.editing() ? 'saved' : 'created'
        }, but navigation failed. Use Back to Sections to try again.`
      : 'Could not return to sections. Please try again.';
    void this.router
      .navigate(['.'], { relativeTo: this.route.parent })
      .then(
        (navigated) => {
          if (!navigated) this.error.set(message);
        },
        () => this.error.set(message)
      );
  }
}
