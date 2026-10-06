import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { finalize, take } from 'rxjs';
import { NavigationService } from '../../../../../services/navigation.service';
import { WorkshopEditorService } from '../../../../../services/workshops.service';

@Component({
  selector: 'ngx-create-page-modal',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
  ],
  template: `
    <h2 mat-dialog-title>Create a New Page?</h2>
    <form [formGroup]="form" (ngSubmit)="create()" [attr.aria-busy]="pending()">
      <mat-dialog-content>
        <mat-form-field class="page-dialog__field">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
          <mat-error>Enter a page name.</mat-error>
        </mat-form-field>
        <mat-radio-group
          class="page-dialog__types"
          formControlName="pageType"
          aria-label="Page type"
        >
          <mat-radio-button value="PAGE">Workshop Page</mat-radio-button>
          <mat-radio-button value="EXAM">Workshop Exam</mat-radio-button>
        </mat-radio-group>
        @if (error()) {
          <p class="page-dialog__error" role="alert">{{ error() }}</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button matButton type="button" mat-dialog-close [disabled]="pending()">Cancel</button>
        <button
          matButton="filled"
          type="submit"
          [disabled]="form.invalid || pending() || !workshopId"
        >
          {{ pending() ? 'Creating…' : 'Create' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .page-dialog__field {
        width: 100%;
      }
      .page-dialog__types {
        display: flex;
        gap: 21px;
        padding: 14px 0;
      }
      .page-dialog__error {
        color: var(--mat-sys-error);
      }
    `,
  ],
})
export class CreatePageModalComponent {
  private readonly editor = inject(WorkshopEditorService);
  private readonly dialog = inject(MatDialogRef<CreatePageModalComponent>);
  private readonly destroyRef = inject(DestroyRef);
  readonly pending = signal(false);
  readonly error = signal('');
  protected workshopId = '';
  private sortId = 0;
  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    pageType: ['PAGE' as 'PAGE' | 'EXAM', Validators.required],
  });

  constructor() {
    inject(NavigationService)
      .getCurrentWorkshop()
      .pipe(take(1))
      .subscribe((workshop) => {
        this.workshopId = workshop?._id ?? '';
        this.sortId = workshop?.workshopDocuments?.length ?? 0;
        if (!this.workshopId) this.error.set('Select a workshop before creating a page.');
      });
  }

  create(): void {
    if (this.pending() || this.form.invalid || !this.workshopId) return;
    this.pending.set(true);
    this.dialog.disableClose = true;
    this.form.disable();
    this.error.set('');
    this.editor
      .createPage({ ...this.form.getRawValue(), workshopId: this.workshopId, sortId: this.sortId })
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
        error: () => this.error.set('Could not create the page. Please try again.'),
      });
  }
}
