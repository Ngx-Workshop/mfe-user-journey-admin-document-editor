import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { WorkshopPageIdentifierDto } from '@tmdjr/document-contracts';
import { finalize, take } from 'rxjs';
import { NavigationService } from '../../../../../services/navigation.service';
import { WorkshopEditorService } from '../../../../../services/workshops.service';

@Component({
  selector: 'ngx-edit-page-modal',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Edit {{ name }}?</h2>
    <form [formGroup]="form" (ngSubmit)="submit()" [attr.aria-busy]="pending()">
      <mat-dialog-content>
        <mat-form-field class="edit-page__field">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" autocomplete="off" />
          <mat-error>Enter a page name.</mat-error>
        </mat-form-field>
        @if (error()) {
          <p class="edit-page__error" role="alert">{{ error() }}</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button matButton type="button" mat-dialog-close [disabled]="pending()">Cancel</button>
        <button matButton="filled" type="submit" [disabled]="form.invalid || pending()">
          {{ pending() ? 'Saving…' : 'Save' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .edit-page__field {
        width: 100%;
      }
      .edit-page__error {
        color: var(--mat-sys-error);
      }
    `,
  ],
})
export class EditPageModalComponent {
  readonly data = inject<{ workshopDocument: WorkshopPageIdentifierDto }>(MAT_DIALOG_DATA);
  readonly name = this.data.workshopDocument.name;
  private readonly editor = inject(WorkshopEditorService);
  private readonly dialog = inject(MatDialogRef<EditPageModalComponent>);
  private readonly destroyRef = inject(DestroyRef);
  readonly pending = signal(false);
  readonly error = signal('');
  private workshopId = '';
  readonly form = inject(FormBuilder).nonNullable.group({
    name: [this.name, [Validators.required, Validators.pattern(/\S/)]],
  });

  constructor() {
    inject(NavigationService)
      .getCurrentWorkshop()
      .pipe(take(1))
      .subscribe((workshop) => {
        this.workshopId = workshop?._id ?? '';
      });
  }

  submit(): void {
    if (this.pending() || this.form.invalid) return;
    this.pending.set(true);
    this.dialog.disableClose = true;
    this.form.disable();
    this.error.set('');
    this.editor
      .editPageName({
        _id: this.data.workshopDocument._id,
        workshopId: this.workshopId,
        name: this.form.getRawValue().name,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.pending.set(false);
          this.dialog.disableClose = false;
          this.form.enable();
        })
      )
      .subscribe({
        next: () => this.dialog.close(),
        error: () => this.error.set('Could not save the page. Please try again.'),
      });
  }
}
