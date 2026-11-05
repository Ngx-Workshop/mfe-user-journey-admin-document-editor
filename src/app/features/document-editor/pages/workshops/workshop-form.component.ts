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

type WorkshopForm = {
  name: FormControl<string>;
  level: FormControl<number>;
  summary: FormControl<string>;
  thumbnail: FormControl<string>;
};

@Component({
  host: { class: 'ngx-design-system ngx-document-design' },
  selector: 'ngx-workshop-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxActionBar, DocumentPanelComponent, DocumentViewportDirective,NgxButton,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    DocumentImagePickerButtonComponent,
    MenuDeviconComponent,
    IsDeviconPipe,
  ],
  template: `
    <ngx-action-bar [heading]="editing() ? 'Edit Workshop' : 'Create Workshop'">      <button
        mat-flat-button ngxButton surface="outline"
        (click)="returnToWorkshops.emit()"
        [disabled]="saving()"
      >
        <mat-icon>arrow_back</mat-icon> Back to Workshops
      </button>
</ngx-action-bar>
    <main class="document-layout"><div class="document-layout__workspace" ngxDocumentViewport><ngx-document-panel heading="Workshop details" eyebrow="DOCUMENTS / METADATA">
    @if (loadingWorkshop()) {
      <p role="status">Loading workshop details…</p>
    }
    <form
      class="workshop-form__body"
      [formGroup]="form()"
      (ngSubmit)="save.emit()"
      [attr.aria-busy]="saving()"
    >
      <fieldset
        class="workshop-form__fields"
        [disabled]="saving() || saved() || !workshopLoaded()"
      >
        <mat-form-field
          class="workshop-form__field"
          appearance="outline"
        >
          <mat-label>Workshop name</mat-label>
          <input matInput formControlName="name" />
          <mat-error>Enter a workshop name.</mat-error>
        </mat-form-field>
        <mat-form-field
          class="workshop-form__field"
          appearance="outline"
        >
          <mat-label>Summary</mat-label>
          <textarea
            matInput
            formControlName="summary"
            rows="4"
          ></textarea>
          <mat-error>Enter a workshop summary.</mat-error>
        </mat-form-field>
        <mat-form-field
          class="workshop-form__field"
          appearance="outline"
        >
          <mat-label>Workshop level</mat-label>
          <input
            matInput
            type="number"
            formControlName="level"
            required
            min="1"
            max="20"
            step="1"
          />
          <mat-error
            >Enter a whole-number level from 1 to 20.</mat-error
          >
        </mat-form-field>
        @if (form().controls.thumbnail.value) {
          @if (form().controls.thumbnail.value | isDevicon) {
            <ngx-menu-devicon
              class="workshop-form__icon-preview"
              role="img"
              aria-label="Workshop thumbnail preview"
              [icon]="form().controls.thumbnail.value"
              [large]="true"
            />
          } @else {
            <img
              class="workshop-form__image-preview"
              [src]="form().controls.thumbnail.value"
              alt="Workshop thumbnail preview"
            />
          }
        }
        <mat-form-field
          class="workshop-form__field"
          appearance="outline"
        >
          <mat-label>Thumbnail image or Devicon</mat-label>
          <input matInput formControlName="thumbnail" />
          <ngx-document-image-picker-button
            matSuffix
            label="Choose thumbnail image"
            [disabled]="saving() || saved() || !workshopLoaded()"
            (imageSelected)="imageSelected.emit($event)"
          />
          <mat-hint
            >Enter an image URL or Devicon classes, e.g.
            devicon-angular-plain colored, or choose an
            image.</mat-hint
          >
          <mat-error
            >Enter an image URL or Devicon classes.</mat-error
          >
        </mat-form-field>
      </fieldset>
      @if (error()) {
        <p class="workshop-form__error" role="alert">{{ error() }}</p>
        @if (!workshopLoaded() && !loadingWorkshop()) {
          <button
            mat-flat-button ngxButton surface="outline"
            type="button"
            (click)="retryWorkshop.emit()"
          >
            Retry loading workshop details
          </button>
        }
      }
      <div class="workshop-form__form-actions">
        <button
          mat-flat-button ngxButton surface="outline"
          type="button"
          (click)="returnToWorkshops.emit()"
          [disabled]="saving()"
        >
          {{ saved() ? 'Back to Workshops' : 'Cancel' }}
        </button>
        <button
          mat-flat-button ngxButton surface="outline"
          type="submit"
          [disabled]="
            form().invalid || saving() || saved() || !workshopLoaded()
          "
        >
          {{
            saving()
              ? editing()
                ? 'Saving…'
                : 'Creating…'
              : editing()
                ? 'Save changes'
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
    .workshop-form__body, .workshop-form__fields { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; border: 0; padding: 0; margin: 0; min-width: 0; }
    .workshop-form__field { width: 100%; min-width: 0; }
    .workshop-form__error { color: var(--ngx-color-error); }
    .workshop-form__form-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .workshop-form__image-preview { max-width: 160px; max-height: 100px; object-fit: contain; }
    .workshop-form__icon-preview { --devicon-size: 40px; }

  `],

})
export class WorkshopFormComponent {
  readonly editing = input(false);
  readonly saving = input(false);
  readonly error = input('');
  readonly loadingWorkshop = input(false);
  readonly workshopLoaded = input(false);
  readonly saved = input(false);
  readonly form = input.required<FormGroup<WorkshopForm>>();
  readonly save = output<void>();
  readonly retryWorkshop = output<void>();
  readonly returnToWorkshops = output<void>();
  readonly imageSelected = output<string>();
}
