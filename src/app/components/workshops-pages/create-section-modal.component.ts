import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs';
import { NavigationService } from '../../services/navigation.service';
import { WorkshopEditorService } from '../../services/workshops.service';

@Component({
  selector: 'ngx-create-section-modal',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Create Section</h2>
    <form
      [formGroup]="form"
      (ngSubmit)="create()"
      [attr.aria-busy]="saving()"
    >
      <mat-dialog-content>
        <mat-form-field appearance="outline">
          <mat-label>Section name</mat-label>
          <input
            matInput
            formControlName="sectionTitle"
            maxlength="120"
            cdkFocusInitial
          />
          <mat-hint>For example, TypeScript or Testing</mat-hint>
          <mat-error
            >Enter a section name of 1–120 characters.</mat-error
          >
        </mat-form-field>
        @if (error()) {
          <p role="alert">{{ error() }}</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button
          matButton
          type="button"
          mat-dialog-close
          [disabled]="saving()"
        >
          Cancel
        </button>
        <button
          matButton="filled"
          type="submit"
          [disabled]="form.invalid || saving()"
        >
          {{ saving() ? 'Creating…' : 'Create' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    mat-form-field {
      width: 100%;
      margin-top: 8px;
    }
    [role='alert'] {
      color: var(--mat-sys-error);
    }
  `,
})
export class CreateSectionModalComponent {
  private readonly editor = inject(WorkshopEditorService);
  private readonly navigation = inject(NavigationService);
  private readonly dialog = inject(
    MatDialogRef<CreateSectionModalComponent>
  );
  private readonly destroyRef = inject(DestroyRef);
  readonly saving = signal(false);
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
  });

  create(): void {
    if (this.saving()) return;
    this.form.controls.sectionTitle.setValue(
      this.form.controls.sectionTitle.value.trim()
    );
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.dialog.disableClose = true;
    this.editor
      .createSection(this.form.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.saving.set(false);
          this.dialog.disableClose = false;
        })
      )
      .subscribe({
        next: (section) => {
          this.navigation.addSection(section);
          this.dialog.close(section);
        },
        error: (error: { status?: number }) =>
          this.error.set(
            error.status === 401 || error.status === 403
              ? 'You need administrator access to create a section.'
              : 'Could not create the section. Please try again.'
          ),
      });
  }
}
