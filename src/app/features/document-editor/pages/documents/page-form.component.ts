import { NgxActionBar } from '@tmdjr/ngx-workshop-design-system';
import { DocumentPanelComponent } from '../../components/document-panel.component';
import { DocumentViewportDirective } from '../../components/document-viewport.directive';
import { ChangeDetectionStrategy } from '@angular/core';
import { NgxButton } from '@tmdjr/ngx-workshop-design-system';
import { Component, input, output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';

import { HandsOnLabMongo } from '@tmdjr/coding-labs-contracts';
import { AssessmentTestDto } from '@tmdjr/service-nestjs-assessment-test-contracts';
import { WorkshopPageKind } from '../../models/workshop-journey';
import { AssessmentTestPickerComponent } from './assessment-test-gallery/assessment-test-picker.component';
import { CodingLabPickerComponent } from './coding-lab-gallery/coding-lab-picker.component';

export type PageForm = FormGroup<{
  name: FormControl<string>;
  resourceId: FormControl<string>;
  pageType: FormControl<WorkshopPageKind>;
}>;

@Component({
  host: { class: 'ngx-design-system ngx-document-design' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ngx-page-form',
  imports: [NgxActionBar, DocumentPanelComponent, DocumentViewportDirective,NgxButton,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    CodingLabPickerComponent,
    AssessmentTestPickerComponent,
  ],
  template: `
    <ngx-action-bar [heading]="editing() ? 'Edit Page' : 'Create Page'">      <button
        mat-flat-button ngxButton surface="outline"
        type="button"
        [disabled]="saving()"
        (click)="back.emit()"
      >
        <mat-icon>arrow_back</mat-icon>Back to Workshop
      </button>
</ngx-action-bar>
    <main class="document-layout"><div class="document-layout__workspace" ngxDocumentViewport><ngx-document-panel heading="Page settings" eyebrow="DOCUMENTS / METADATA">
      @if (loading()) {
        <p role="status">Loading page details...</p>
      }
      @if (error()) {
        <p class="page-form__error" role="alert">{{ error() }}</p>
        @if (!loaded() && !loading()) {
          <button mat-flat-button ngxButton surface="outline" type="button" (click)="retry.emit()">
            Retry loading
          </button>
        }
      }
      @if (loaded()) {
        <form
          [formGroup]="form()"
          (ngSubmit)="save.emit()"
          [attr.aria-busy]="saving()"
        >
          <mat-form-field class="page-form__field">
            <mat-label>Name</mat-label>
            <input
              matInput
              formControlName="name"
              autocomplete="off"
            />
            <mat-error>Enter a page name.</mat-error>
          </mat-form-field>
          @if (!editing()) {
            <mat-radio-group
              class="page-form__types"
              formControlName="pageType"
              aria-label="Page type"
            >
              <mat-radio-button value="PAGE"
                >Workshop Page</mat-radio-button
              >
              <mat-radio-button value="ASSESSMENT_TEST"
                >Assessment Test</mat-radio-button
              >
              <mat-radio-button value="CODING_LAB"
                >Coding Lab</mat-radio-button
              >
            </mat-radio-group>
            @if (form().controls.pageType.value === 'CODING_LAB') {
              <ngx-coding-lab-picker
                [selectedId]="form().controls.resourceId.value"
                [selectedLab]="selectedCodingLab()"
                [disabled]="saving() || saved()"
                (selected)="codingLabSelected.emit($event)"
              />
              <p>
                Opening this page will show the published coding lab
                learner preview.
              </p>
            } @else if (
              form().controls.pageType.value === 'ASSESSMENT_TEST'
            ) {
              <ngx-assessment-test-picker
                [selectedId]="form().controls.resourceId.value"
                [selectedTest]="selectedAssessmentTest()"
                [disabled]="saving() || saved()"
                (selected)="assessmentTestSelected.emit($event)"
              />
              <p>
                Opening this page will show an interactive learner
                preview.
              </p>
            }
          }
          <div class="page-form__actions">
            <button
              mat-flat-button ngxButton surface="outline"
              type="button"
              [disabled]="saving()"
              (click)="back.emit()"
            >
              {{ saved() ? 'Return to Workshop' : 'Cancel' }}
            </button>
            <button
              mat-flat-button ngxButton surface="outline"
              type="submit"
              [disabled]="form().invalid || saving() || saved()"
            >
              {{
                saving() ? 'Saving...' : editing() ? 'Save' : 'Create'
              }}
            </button>
          </div>
        </form>
      }
    </ngx-document-panel></div></main>
  `,
  styles: [`
    :host { display: block; min-width: 0; color: var(--ngx-color-text); background: var(--ngx-color-canvas); }
    ngx-action-bar { --ngx-action-bar-top: 96px; }
    .document-layout { padding: 1rem; }
    .document-layout__workspace { min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); gap: 1rem; }
    @media (max-width: 720px) {
      ngx-action-bar { --ngx-action-bar-top: 76px; gap: 4px; }
      ngx-action-bar a, ngx-action-bar button { min-width: 0; padding-inline: 8px; font-size: 0.7rem; }
      .document-layout { padding: 0.5rem; }
    }
    form { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; min-width: 0; }
    .page-form__field { width: 100%; min-width: 0; }
    .page-form__types { display: flex; flex-wrap: wrap; gap: 8px; }
    .page-form__actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .page-form__error { color: var(--ngx-color-error); }

  `],

})
export class PageFormComponent {
  readonly form = input.required<PageForm>();
  readonly editing = input(false);
  readonly loading = input(false);
  readonly loaded = input(false);
  readonly saving = input(false);
  readonly saved = input(false);
  readonly error = input('');
  readonly selectedAssessmentTest = input<AssessmentTestDto | null>(
    null
  );
  readonly assessmentTestSelected = output<AssessmentTestDto>();
  readonly selectedCodingLab = input<HandsOnLabMongo | null>(null);
  readonly codingLabSelected = output<HandsOnLabMongo>();
  readonly save = output<void>();
  readonly back = output<void>();
  readonly retry = output<void>();
}
