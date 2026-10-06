import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DocumentImagePickerDialogComponent } from './document-image-picker-dialog.component';

@Component({
  selector: 'ngx-document-image-picker-button',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <button
      matIconButton
      type="button"
      [disabled]="disabled()"
      [attr.aria-label]="label()"
      [title]="label()"
      (click)="open()"
    >
      <mat-icon>photo_library</mat-icon>
    </button>
  `,
})
export class DocumentImagePickerButtonComponent {
  private readonly dialogs = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private dialogRef?: MatDialogRef<
    DocumentImagePickerDialogComponent,
    string
  >;
  readonly label = input('Choose image');
  readonly disabled = input(false);
  readonly imageSelected = output<string>();

  constructor() {
    effect(() => {
      if (this.disabled()) this.dialogRef?.close();
    });
    this.destroyRef.onDestroy(() => this.dialogRef?.close());
  }

  open(): void {
    if (this.disabled() || this.dialogRef) return;
    const ref = this.dialogs.open<
      DocumentImagePickerDialogComponent,
      undefined,
      string
    >(DocumentImagePickerDialogComponent, {
      width: '1100px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 'calc(100dvh - 32px)',
      autoFocus: 'first-tabbable',
      ariaModal: true,
      restoreFocus: true,
    });
    this.dialogRef = ref;
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((url) => {
        this.dialogRef = undefined;
        if (url !== undefined && !this.disabled())
          this.imageSelected.emit(url);
      });
  }
}
