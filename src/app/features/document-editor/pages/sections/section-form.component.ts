import { NgxActionBar } from '@tmdjr/ngx-workshop-design-system';
import { DocumentPanelComponent } from '../../components/document-panel.component';
import { DocumentViewportDirective } from '../../components/document-viewport.directive';
import { NgxButton } from '@tmdjr/ngx-workshop-design-system';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import {
  IsDeviconPipe,
  MenuDeviconComponent,
} from '../../components/devicon.component';
import { DocumentImagePickerButtonComponent } from '../../components/document-image-picker/document-image-picker-button.component';

type SectionForm = {
  sectionTitle: FormControl<string>;
  sectionDescription: FormControl<string>;
  menuSvgPath: FormControl<string>;
  headerSvgPath: FormControl<string>;
};

@Component({
  host: { class: 'ngx-design-system ngx-document-design' },
  selector: 'ngx-section-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxActionBar, DocumentPanelComponent, DocumentViewportDirective,NgxButton,
    RouterModule,
    DocumentImagePickerButtonComponent,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MenuDeviconComponent,
    IsDeviconPipe,
  ],
  template: `
    <ngx-action-bar [heading]="editing() ? 'Edit Section' : 'Create Section'">      <a
        [routerLink]="editing() ? '../../' : '../'"
        mat-flat-button ngxButton surface="outline"
      >
        <mat-icon>arrow_back</mat-icon> Back to Sections</a
      >
</ngx-action-bar>
    <main class="document-layout"><div class="document-layout__workspace" ngxDocumentViewport><ngx-document-panel heading="Section details" eyebrow="DOCUMENTS / METADATA">
    @if (loadingSection()) {
      <p role="status">Loading section…</p>
    }
    <form
      class="section-form__body"
      [formGroup]="form()"
      (ngSubmit)="create.emit()"
      [attr.aria-busy]="saving()"
    >
      <fieldset
        class="section-form__fields"
        [disabled]="
          saving() || created() || (editing() && !sectionLoaded())
        "
      >
        <mat-form-field
          class="section-form__field"
          appearance="outline"
        >
          <mat-label>Section name</mat-label>
          <input
            matInput
            formControlName="sectionTitle"
            maxlength="120"
          />
          <mat-hint>For example, TypeScript or Testing</mat-hint>
          <mat-error
            >Enter a section name of 1–120 characters.</mat-error
          >
        </mat-form-field>
        <mat-form-field
          class="section-form__field"
          appearance="outline"
        >
          <mat-label>Section description</mat-label>
          <textarea
            matInput
            formControlName="sectionDescription"
            rows="4"
          ></textarea>
          <mat-hint>Describe the workshops in this section.</mat-hint>
        </mat-form-field>
        @if (form().controls.menuSvgPath.value) {
          @if (form().controls.menuSvgPath.value | isDevicon) {
            <ngx-menu-devicon
              class="section-form__icon-preview section-form__menu-icon-preview"
              role="img"
              aria-label="Section menu image preview"
              [icon]="form().controls.menuSvgPath.value"
              [large]="true"
            />
          } @else {
            <img
              class="section-form__image-preview section-form__menu-image-preview"
              [src]="form().controls.menuSvgPath.value"
              alt="Sections Menu Image Preview"
            />
          }
        }
        <mat-form-field
          class="section-form__field"
          appearance="outline"
        >
          <mat-label>Menu image or Devicon</mat-label>
          <input matInput formControlName="menuSvgPath" />
          <ngx-document-image-picker-button
            matSuffix
            label="Choose menu image"
            [disabled]="
              saving() || created() || (editing() && !sectionLoaded())
            "
            (imageSelected)="
              imageSelected.emit({
                field: 'menuSvgPath',
                url: $event,
              })
            "
          />
          <mat-hint
            >Image URL/path or Devicon classes, e.g.
            devicon-angular-plain colored. Leave blank for default
            artwork.</mat-hint
          >
        </mat-form-field>
        @if (form().controls.headerSvgPath.value) {
          @if (form().controls.headerSvgPath.value | isDevicon) {
            <ngx-menu-devicon
              class="section-form__icon-preview section-form__header-icon-preview"
              role="img"
              aria-label="Section header image preview"
              [icon]="form().controls.headerSvgPath.value"
              [large]="true"
            />
          } @else {
            <img
              class="section-form__image-preview section-form__header-image-preview"
              [src]="form().controls.headerSvgPath.value"
              alt="Sections header image preview"
            />
          }
        }
        <mat-form-field
          class="section-form__field"
          appearance="outline"
        >
          <mat-label>Header image or Devicon</mat-label>
          <input matInput formControlName="headerSvgPath" />
          <ngx-document-image-picker-button
            matSuffix
            label="Choose header image"
            [disabled]="
              saving() || created() || (editing() && !sectionLoaded())
            "
            (imageSelected)="
              imageSelected.emit({
                field: 'headerSvgPath',
                url: $event,
              })
            "
          />
          <mat-hint
            >Image URL/path or Devicon classes. Used in the section
            catalog and header.</mat-hint
          >
        </mat-form-field>
      </fieldset>
      @if (error()) {
        <p class="section-form__error" role="alert">{{ error() }}</p>
        @if (editing() && !sectionLoaded() && !loadingSection()) {
          <button
            mat-flat-button ngxButton surface="outline"
            type="button"
            (click)="retrySection.emit()"
          >
            Retry loading section
          </button>
        }
      }
      <div class="section-form__form-actions">
        <button
          mat-flat-button ngxButton surface="outline"
          type="button"
          (click)="returnToSections.emit()"
          [disabled]="saving()"
        >
          {{ created() ? 'Back to Sections' : 'Cancel' }}
        </button>
        <button
          mat-flat-button ngxButton surface="outline"
          type="submit"
          [disabled]="
            form().invalid ||
            saving() ||
            created() ||
            (editing() && !sectionLoaded())
          "
        >
          {{
            editing()
              ? saving()
                ? 'Saving…'
                : 'Save changes'
              : saving()
                ? 'Creating…'
                : 'Create'
          }}
        </button>
      </div>
    </form>
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
    .section-form__body, .section-form__fields { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; border: 0; padding: 0; margin: 0; min-width: 0; }
    .section-form__field { width: 100%; min-width: 0; }
    .section-form__error { color: var(--ngx-color-error); }
    .section-form__form-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .section-form__image-preview { max-width: 160px; max-height: 100px; object-fit: contain; }
    .section-form__icon-preview { --devicon-size: 40px; }

  `],

})
export class SectionFormComponent {
  readonly editing = input(false);
  readonly saving = input(false);
  readonly error = input('');
  readonly loadingSection = input(false);
  readonly sectionLoaded = input(false);
  readonly created = input(false);
  readonly form = input.required<FormGroup<SectionForm>>();
  readonly create = output<void>();
  readonly retrySection = output<void>();
  readonly returnToSections = output<void>();
  readonly imageSelected = output<{
    field: 'menuSvgPath' | 'headerSvgPath';
    url: string;
  }>();
}
