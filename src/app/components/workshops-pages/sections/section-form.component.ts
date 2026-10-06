import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { NgxParticleHeader } from '@tmdjr/ngx-shared-headers';
import { IsDeviconPipe, MenuDeviconComponent } from '../../devicon.component';
import { DocumentImagePickerButtonComponent } from '../../document-image-picker/document-image-picker-button.component';

type SectionForm = {
  sectionTitle: FormControl<string>;
  sectionDescription: FormControl<string>;
  menuSvgPath: FormControl<string>;
  headerSvgPath: FormControl<string>;
};

@Component({
  selector: 'ngx-section-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    DocumentImagePickerButtonComponent,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    NgxParticleHeader,
    MatIconModule,
    MenuDeviconComponent,
    IsDeviconPipe,
  ],
  template: `
    <ngx-particle-header>
      <h1 class="section-form__title">{{ editing() ? 'Edit Section' : 'Create Section' }}</h1>
    </ngx-particle-header>
    <div class="section-form__action-bar">
      <a [routerLink]="editing() ? '../../' : '../'" matButton="filled">
        <mat-icon>arrow_back</mat-icon> Back to Sections</a
      >
    </div>
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
        [disabled]="saving() || created() || (editing() && !sectionLoaded())"
      >
        <mat-form-field class="section-form__field" appearance="outline">
          <mat-label>Section name</mat-label>
          <input matInput formControlName="sectionTitle" maxlength="120" />
          <mat-hint>For example, TypeScript or Testing</mat-hint>
          <mat-error>Enter a section name of 1–120 characters.</mat-error>
        </mat-form-field>
        <mat-form-field class="section-form__field" appearance="outline">
          <mat-label>Section description</mat-label>
          <textarea matInput formControlName="sectionDescription" rows="4"></textarea>
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
        <mat-form-field class="section-form__field" appearance="outline">
          <mat-label>Menu image or Devicon</mat-label>
          <input matInput formControlName="menuSvgPath" />
          <ngx-document-image-picker-button
            matSuffix
            label="Choose menu image"
            [disabled]="saving() || created() || (editing() && !sectionLoaded())"
            (imageSelected)="imageSelected.emit({ field: 'menuSvgPath', url: $event })"
          />
          <mat-hint
            >Image URL/path or Devicon classes, e.g. devicon-angular-plain colored. Leave blank for
            default artwork.</mat-hint
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
        <mat-form-field class="section-form__field" appearance="outline">
          <mat-label>Header image or Devicon</mat-label>
          <input matInput formControlName="headerSvgPath" />
          <ngx-document-image-picker-button
            matSuffix
            label="Choose header image"
            [disabled]="saving() || created() || (editing() && !sectionLoaded())"
            (imageSelected)="imageSelected.emit({ field: 'headerSvgPath', url: $event })"
          />
          <mat-hint
            >Image URL/path or Devicon classes. Used in the section catalog and header.</mat-hint
          >
        </mat-form-field>
      </fieldset>
      @if (error()) {
        <p class="section-form__error" role="alert">{{ error() }}</p>
        @if (editing() && !sectionLoaded() && !loadingSection()) {
          <button matButton type="button" (click)="retrySection.emit()">
            Retry loading section
          </button>
        }
      }
      <div class="section-form__form-actions">
        <button matButton type="button" (click)="returnToSections.emit()" [disabled]="saving()">
          {{ created() ? 'Back to Sections' : 'Cancel' }}
        </button>
        <button
          matButton="filled"
          type="submit"
          [disabled]="form().invalid || saving() || created() || (editing() && !sectionLoaded())"
        >
          {{
            editing() ? (saving() ? 'Saving…' : 'Save changes') : saving() ? 'Creating…' : 'Create'
          }}
        </button>
      </div>
    </form>
  `,
  styles: [
    `
      .section-form__title {
        font-size: 1.85rem;
        font-weight: 100;
        margin: 1.7rem 0;
        padding: 0 1rem;
      }

      .section-form__body {
        display: block;
        max-width: 960px;
        margin: auto;
        padding: 24px;
      }
      .section-form__fields {
        border: 0;
        padding: 0;
        margin: 0;
        min-width: 0;
      }
      .section-form__field {
        width: 100%;
        margin-top: 8px;
      }
      .section-form__error {
        color: var(--mat-sys-error);
      }
      .section-form__form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
      }
      .section-form__action-bar {
        position: sticky;
        top: 56px;
        height: 56px;
        z-index: 5;
        display: flex;
        flex-direction: row;
        width: 100%;
        background: var(--mat-sys-primary);
        align-items: center;
        a,
        button,
        mat-paginator {
          color: var(--mat-sys-on-primary);
          background: var(--mat-sys-primary);
          margin: 0 12px;
        }
      }
      .section-form__image-preview,
      .section-form__icon-preview {
        display: block;
        max-width: 100%;
        max-height: 240px;
        margin: 1rem 0;
      }
    `,
  ],
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
  readonly imageSelected = output<{ field: 'menuSvgPath' | 'headerSvgPath'; url: string }>();
}
