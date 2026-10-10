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
import { NgxParticleHeader } from '@tmdjr/ngx-shared-headers';
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
  selector: 'ngx-workshop-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    NgxParticleHeader,
    DocumentImagePickerButtonComponent,
    MenuDeviconComponent,
    IsDeviconPipe,
  ],
  template: `
    <ngx-particle-header>
      <h1 class="workshop-form__title">
        {{ editing() ? 'Edit Workshop' : 'Create Workshop' }}
      </h1>
    </ngx-particle-header>
    <div class="workshop-form__action-bar">
      <button
        matButton="filled"
        (click)="returnToWorkshops.emit()"
        [disabled]="saving()"
      >
        <mat-icon>arrow_back</mat-icon> Back to Workshops
      </button>
    </div>
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
          <mat-error>Enter a whole-number level from 1 to 20.</mat-error>
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
            matButton
            type="button"
            (click)="retryWorkshop.emit()"
          >
            Retry loading workshop details
          </button>
        }
      }
      <div class="workshop-form__form-actions">
        <button
          matButton
          type="button"
          (click)="returnToWorkshops.emit()"
          [disabled]="saving()"
        >
          {{ saved() ? 'Back to Workshops' : 'Cancel' }}
        </button>
        <button
          matButton="filled"
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
  `,
  styles: [
    `
      .workshop-form__title {
        font-size: 1.85rem;
        font-weight: 100;
        margin: 1.7rem 0;
        padding: 0 1rem;
      }
      .workshop-form__body {
        max-width: 960px;
        margin: auto;
        padding: 24px;
      }
      .workshop-form__fields {
        border: 0;
        padding: 0;
        margin: 0;
        min-width: 0;
      }
      .workshop-form__field {
        width: 100%;
        margin-top: 8px;
      }
      .workshop-form__error {
        color: var(--mat-sys-error);
      }
      .workshop-form__image-preview,
      .workshop-form__icon-preview {
        display: block;
        max-width: 100%;
        max-height: 240px;
        margin: 1rem 0;
      }
      .workshop-form__form-actions {
        display: flex;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 24px;
      }
      .workshop-form__action-bar {
        position: sticky;
        top: 56px;
        height: 56px;
        z-index: 5;
        display: flex;
        align-items: center;
        background: var(--mat-sys-primary);
        button {
          color: var(--mat-sys-on-primary);
          background: var(--mat-sys-primary);
          margin: 0 12px;
        }
      }
    `,
  ],
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
