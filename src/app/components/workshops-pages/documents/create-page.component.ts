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
import { HandsOnLabMongo } from '@tmdjr/coding-labs-contracts';
import { WorkshopDto } from '@tmdjr/document-contracts';
import { AssessmentTestDto } from '@tmdjr/service-nestjs-assessment-test-contracts';
import {
  catchError,
  combineLatest,
  finalize,
  map,
  of,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';
import { WorkshopPageKind } from '../../../models/workshop-journey';
import { NavigationService } from '../../../services/navigation.service';
import { WorkshopEditorService } from '../../../services/workshops.service';
import { PageFormComponent } from './page-form.component';

@Component({
  selector: 'ngx-create-page',
  imports: [PageFormComponent],
  template: `<ngx-page-form
    [form]="form"
    [editing]="editing()"
    [loading]="loading()"
    [loaded]="loaded()"
    [saving]="saving()"
    [saved]="saved()"
    [error]="error()"
    [selectedAssessmentTest]="selectedAssessmentTest()"
    (assessmentTestSelected)="selectAssessmentTest($event)"
    [selectedCodingLab]="selectedCodingLab()"
    (codingLabSelected)="selectCodingLab($event)"
    (save)="save()"
    (back)="returnToWorkshop()"
    (retry)="retry()"
  />`,
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
  readonly selectedAssessmentTest = signal<AssessmentTestDto | null>(
    null
  );
  readonly selectedCodingLab = signal<HandsOnLabMongo | null>(null);
  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    pageType: ['PAGE' as WorkshopPageKind, Validators.required],
    resourceId: [''],
  });

  constructor() {
    this.form.controls.pageType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.editing()) {
          this.selectedCodingLab.set(null);
          this.selectedAssessmentTest.set(null);
          this.form.controls.resourceId.setValue('');
        }
        this.updateResourceValidation();
      });
    combineLatest([
      combineLatest(
        this.route.pathFromRoot.map((route) => route.paramMap)
      ),
      this.reload.pipe(startWith(undefined)),
    ])
      .pipe(
        switchMap(([params]) => {
          this.sectionId =
            params
              .find((value) => value.has('section'))
              ?.get('section') ?? '';
          this.workshopSlug =
            params
              .find((value) => value.has('workshopId'))
              ?.get('workshopId') ?? '';
          this.pageId.set(
            this.route.snapshot.paramMap.get('documentId')
          );
          this.returnPageId =
            this.pageId() ??
            this.route.snapshot.queryParamMap.get('returnPage') ??
            '';
          this.workshop = null;
          this.loaded.set(false);
          this.saved.set(false);
          this.error.set('');
          this.form.reset({
            name: '',
            pageType: 'PAGE',
            resourceId: '',
          });
          this.form.disable({ emitEvent: false });
          this.loading.set(true);
          return this.navigation
            .navigateToSection(this.sectionId, true)
            .pipe(
              switchMap((workshops) => {
                const workshop = workshops.find(
                  (item) =>
                    item.workshopDocumentGroupId === this.workshopSlug
                );
                if (!workshop) {
                  this.error.set(
                    'This workshop no longer exists in this section.'
                  );
                  return of(null);
                }
                return this.navigation
                  .navigateToWorkshop(this.workshopSlug)
                  .pipe(map(() => workshop));
              }),
              catchError((error: { status?: number }) => {
                this.error.set(this.requestError(error, 'load'));
                return of(null);
              }),
              finalize(() => this.loading.set(false))
            );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((workshop) => {
        if (!workshop) return;
        this.workshop = workshop;
        const id = this.pageId();
        if (id !== null) {
          const page = workshop.workshopDocuments.find(
            (item) => item._id === id
          );
          if (!page) {
            this.error.set(
              'This page no longer exists in this workshop.'
            );
            return;
          }
          this.form.patchValue({
            name: page.name,
            pageType: page.kind,
            resourceId: page.kind === 'PAGE' ? '' : page.resourceId,
          });
        }
        this.loaded.set(true);
        this.form.enable({ emitEvent: false });
      });
  }

  selectAssessmentTest(test: AssessmentTestDto): void {
    if (
      !this.loaded() ||
      this.editing() ||
      this.saving() ||
      this.saved() ||
      this.form.controls.pageType.value !== 'ASSESSMENT_TEST'
    )
      return;
    this.selectedAssessmentTest.set(test);
    this.form.controls.resourceId.setValue(test._id);
    this.form.controls.resourceId.markAsDirty();
    const name = this.form.controls.name;
    if (!name.dirty || !name.value.trim()) name.setValue(test.name);
  }

  selectCodingLab(lab: HandsOnLabMongo): void {
    if (
      !this.loaded() ||
      this.editing() ||
      this.saving() ||
      this.saved() ||
      this.form.controls.pageType.value !== 'CODING_LAB'
    )
      return;
    this.selectedCodingLab.set(lab);
    this.form.controls.resourceId.setValue(lab._id);
    this.form.controls.resourceId.markAsDirty();
    const name = this.form.controls.name;
    if (!name.dirty || !name.value.trim()) name.setValue(lab.title);
  }

  retry(): void {
    if (!this.loading() && !this.saving() && !this.saved())
      this.reload.next();
  }

  save(): void {
    if (this.saving() || this.saved()) return;
    const workshop = this.workshop;
    if (!this.loaded() || !workshop) {
      this.error.set(
        this.error() || 'Load the page details before saving.'
      );
      return;
    }
    this.form.controls.name.setValue(
      this.form.controls.name.value.trim()
    );
    this.updateResourceValidation();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.form.disable({ emitEvent: false });
    const id = this.pageId();
    const { name, pageType, resourceId } = this.form.getRawValue();
    const request =
      id !== null
        ? this.editor.editPageName({
            _id: id,
            workshopId: workshop._id,
            name,
          })
        : pageType === 'PAGE'
        ? this.editor.createPage({
            name,
            pageType: 'PAGE',
            workshopId: workshop._id,
          })
        : this.editor.addReference({
            name,
            kind: pageType,
            resourceId,
            workshopId: workshop._id,
          });
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.saving.set(false);
          if (!this.saved()) this.form.enable({ emitEvent: false });
        })
      )
      .subscribe({
        next: ({ success }) => {
          if (!success) {
            this.error.set(
              'The server did not confirm the page save. Please try again.'
            );
            return;
          }
          this.saved.set(true);
          this.saving.set(false);
          this.workshop = success;
          this.workshopSlug = success.workshopDocumentGroupId;
          const destination =
            id ??
            success.workshopDocuments.find(
              (page) =>
                !workshop.workshopDocuments.some(
                  (previous) => previous._id === page._id
                )
            )?._id;
          if (!destination) {
            this.error.set(
              'The page was saved, but its link was not returned. Return to the workshop to continue.'
            );
            return;
          }
          this.returnPageId = destination;
          this.returnToWorkshop();
        },
        error: (error: { status?: number }) =>
          this.error.set(this.requestError(error, 'save')),
      });
  }

  returnToWorkshop(): void {
    if (this.saving()) return;
    const pages = [...(this.workshop?.workshopDocuments ?? [])].sort(
      (a, b) => a.sortId - b.sortId
    );
    const page =
      pages.find((item) => item._id === this.returnPageId) ??
      pages[0];
    const commands = page
      ? [this.workshopSlug, page._id]
      : ['workshop-list'];
    const sectionRoute = this.route.parent?.parent;
    const message = this.saved()
      ? 'The page was saved, but navigation failed. Use Back to Workshop to try again.'
      : 'Could not return to the workshop. Please try again.';
    void this.router
      .navigate(commands, { relativeTo: sectionRoute })
      .then(
        (navigated) => {
          if (!navigated) this.error.set(message);
        },
        () => this.error.set(message)
      );
  }

  private updateResourceValidation(): void {
    const control = this.form.controls.resourceId;
    control.setValidators(
      !this.editing() && this.form.controls.pageType.value !== 'PAGE'
        ? [Validators.required, Validators.pattern(/\S/)]
        : []
    );
    control.updateValueAndValidity({ emitEvent: false });
  }

  private requestError(
    error: { status?: number },
    action: 'load' | 'save'
  ): string {
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
