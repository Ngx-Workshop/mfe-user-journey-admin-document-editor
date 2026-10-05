import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import {
  Asset,
  assetErrorMessage,
  AssetFolder,
  AssetManagerComponent,
  assetPreviewUrl,
} from '@tmdjr/ngx-asset-manager';
import { finalize } from 'rxjs';
import {
  DocumentAssetsService,
  DocumentsAssetFolderNotFoundError,
} from '../../services/document-assets.service';

@Component({
  selector: 'ngx-document-image-picker-dialog',
  imports: [MatButtonModule, MatDialogModule, AssetManagerComponent],
  template: `
    <h2 mat-dialog-title>Choose a document image</h2>
    <mat-dialog-content>
      @if (loading()) {
        <p role="status">Loading document images…</p>
      } @else if (folder(); as folder) {
        <ngx-asset-manager
          title="Document images"
          view="full"
          mode="both"
          [folderId]="folder._id"
          [browseFolders]="false"
          [assetTypes]="['image']"
          [uploadFolderId]="folder._id"
          [uploadFolderLabel]="folder.name"
          accept="image/*"
          (assetSelected)="selectImage($event)"
          (uploaded)="selectImage($event)"
        />
      }
      @if (error()) {
        <p role="alert">{{ error() }}</p>
        @if (!folder() && !loading()) {
          <button matButton type="button" (click)="loadFolder()">Retry loading images</button>
        }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton type="button" [mat-dialog-close]="undefined">Cancel</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { min-height: 120px; }
    [role='alert'] { color: var(--mat-sys-error); }
  `],
})
export class DocumentImagePickerDialogComponent {
  private readonly assets = inject(DocumentAssetsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(MatDialogRef<DocumentImagePickerDialogComponent, string>);
  readonly folder = signal<AssetFolder | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  constructor() {
    this.loadFolder();
  }

  loadFolder(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.assets.findDocumentsFolder().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (folder) => this.folder.set(folder),
      error: (error: unknown) => this.error.set(
        error instanceof DocumentsAssetFolderNotFoundError
          ? error.message
          : assetErrorMessage(error)
      ),
    });
  }

  selectImage(asset: Asset): void {
    const url = assetPreviewUrl(asset);
    if (!url) {
      this.error.set('This image has no usable URL. Select another image or cancel to enter an image URL manually.');
      return;
    }
    this.dialogRef.close(url);
  }
}
