import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SectionDto } from '@tmdjr/document-contracts';
import { finalize } from 'rxjs';
import { MatchStringValidator } from '../../../form-validators/match-string.validator';
import { NavigationService } from '../../../services/navigation.service';
import { WorkshopEditorService } from '../../../services/workshops.service';

export interface DeleteSectionDialogData {
  section: SectionDto;
}

@Component({
  selector: 'ngx-delete-section-modal',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Delete {{ section.sectionTitle }}?</h2>
    <form [formGroup]="form" (ngSubmit)="deleteSection()" [attr.aria-busy]="saving()">
      <mat-dialog-content>
        <p>Only empty sections can be deleted. Move or delete their workshops first.</p>
        <p>
          To confirm, type <strong>{{ section.sectionTitle }}</strong> below.
        </p>
        <fieldset class="delete-section__fields" [disabled]="saving() || deleted()">
          <mat-form-field class="delete-section__field" appearance="outline">
            <mat-label>Section name</mat-label>
            <input matInput formControlName="sectionTitle" autocomplete="off" />
            <mat-error>Enter the section name exactly as shown.</mat-error>
          </mat-form-field>
        </fieldset>
        @if (error()) {
          <p class="delete-section__error" role="alert">{{ error() }}</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button matButton type="button" [mat-dialog-close]="undefined" [disabled]="saving()">
          Cancel
        </button>
        <button
          matButton="filled"
          class="delete-section__button"
          type="submit"
          [disabled]="form.invalid || saving() || deleted()"
        >
          {{ saving() ? 'Deleting…' : 'Delete section' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .delete-section__fields {
        border: 0;
        padding: 0;
        margin: 0;
        min-width: 0;
      }
      .delete-section__field {
        width: 100%;
      }
      .delete-section__error {
        color: var(--mat-sys-error);
      }
      .delete-section__button:not(:disabled) {
        color: var(--mat-sys-on-error);
        background-color: var(--mat-sys-error);
      }
    `,
  ],
})
export class DeleteSectionModalComponent {
  private readonly editor = inject(WorkshopEditorService);
  private readonly navigation = inject(NavigationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(MatDialogRef<DeleteSectionModalComponent, boolean>);
  readonly section = inject<DeleteSectionDialogData>(MAT_DIALOG_DATA).section;
  readonly saving = signal(false);
  readonly deleted = signal(false);
  readonly error = signal('');
  readonly form = inject(FormBuilder).nonNullable.group(
    { sectionTitle: ['', Validators.required] },
    { validators: MatchStringValidator('sectionTitle', this.section.sectionTitle) }
  );

  deleteSection(): void {
    if (this.saving() || this.deleted()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.dialogRef.disableClose = true;
    this.error.set('');
    this.editor
      .deleteSection(this.section._id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.saving.set(false);
          this.dialogRef.disableClose = false;
        })
      )
      .subscribe({
        next: (result) => {
          if (result?.acknowledged !== true || result.deletedCount !== 1) {
            this.error.set(
              'The server did not confirm section deletion. Your section has not been removed from the list. Please try again.'
            );
            return;
          }
          this.deleted.set(true);
          this.dialogRef.close(true);
        },
        error: (error: { status?: number }) => {
          this.error.set(
            error.status === 401 || error.status === 403
              ? 'You need administrator access to delete a section.'
              : error.status === 409
                ? 'This section contains workshops. Move or delete those workshops before deleting the section.'
                : error.status === 404
                  ? 'This section no longer exists. Close this dialog and refresh the list.'
                  : error.status === 400
                    ? 'The section identifier is invalid. Close this dialog and refresh the list.'
                    : 'Could not delete the section. Please try again.'
          );
        },
      });
  }
}
