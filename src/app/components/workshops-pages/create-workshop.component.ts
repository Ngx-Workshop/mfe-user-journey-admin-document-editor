import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  Asset,
  assetErrorMessage,
  AssetFolder,
  AssetManagerComponent,
  assetPreviewUrl,
} from '@tmdjr/ngx-asset-manager';
import { NgxParticleHeader } from '@tmdjr/ngx-shared-headers';
import {
  catchError,
  combineLatest,
  finalize,
  of,
  startWith,
  Subject,
  switchMap,
  take,
} from 'rxjs';
import {
  DocumentAssetsService,
  DocumentsAssetFolderNotFoundError,
} from '../../services/document-assets.service';
import { NavigationService } from '../../services/navigation.service';
import { WorkshopEditorService } from '../../services/workshops.service';

@Component({
  selector: 'ngx-create-workshop',
  imports: [
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    NgxParticleHeader,
    AssetManagerComponent,
  ],
  template: `
    <ngx-particle-header>
      <h1>{{ editing() ? 'Edit Workshop' : 'Create Workshop' }}</h1>
    </ngx-particle-header>
    <div class="action-bar">
      <button matButton="filled" (click)="returnToWorkshops()" [disabled]="saving()">
        <mat-icon>arrow_back</mat-icon> Back to Workshops
      </button>
    </div>
    @if (loadingWorkshop()) {
      <p role="status">Loading workshop details…</p>
    }
    <form [formGroup]="form" (ngSubmit)="save()" [attr.aria-busy]="saving()">
      <fieldset [disabled]="saving() || saved() || !workshopLoaded()">
        <mat-form-field appearance="outline">
          <mat-label>Workshop name</mat-label>
          <input matInput formControlName="name" />
          <mat-error>Enter a workshop name.</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Summary</mat-label>
          <textarea matInput formControlName="summary" rows="4"></textarea>
          <mat-error>Enter a workshop summary.</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Thumbnail image URL</mat-label>
          <input matInput formControlName="thumbnail" />
          <mat-hint>Enter an image URL or select a document image below.</mat-hint>
          <mat-error>Select an image or enter its URL.</mat-error>
        </mat-form-field>
        @if (form.controls.thumbnail.value) {
          <img class="image-preview" [src]="form.controls.thumbnail.value" alt="Workshop thumbnail preview" />
        }
        <div class="asset-manager-wrapper">
          @if (loadingAssetFolder()) {
            <p role="status">Loading document images…</p>
          } @else if (assetFolder(); as folder) {
            <ngx-asset-manager
              title="Document images"
              view="full"
              mode="both"
              [folderId]="folder._id"
              [assetTypes]="['image']"
              [uploadFolderId]="folder._id"
              [uploadFolderLabel]="folder.name"
              accept="image/*"
              (assetSelected)="selectAsset($event)"
              (uploaded)="selectAsset($event)"
            />
            @if (assetSelected(); as asset) {
              <p role="status">Selected image: {{ asset.name }}</p>
              <button matButton type="button" (click)="useSelectedAsset()">Use for thumbnail</button>
            }
            @if (assetSelectionError()) {
              <p role="alert">{{ assetSelectionError() }}</p>
            }
          } @else if (assetFolderError()) {
            <p role="alert">{{ assetFolderError() }}</p>
            <button matButton type="button" (click)="loadAssetFolder()">Retry loading images</button>
          }
        </div>
      </fieldset>
      @if (error()) {
        <p role="alert">{{ error() }}</p>
        @if (!workshopLoaded() && !loadingWorkshop()) {
          <button matButton type="button" (click)="retryWorkshop()">Retry loading workshop details</button>
        }
      }
      <div class="form-actions">
        <button matButton type="button" (click)="returnToWorkshops()" [disabled]="saving()">
          {{ saved() ? 'Back to Workshops' : 'Cancel' }}
        </button>
        <button matButton="filled" type="submit"
          [disabled]="form.invalid || saving() || saved() || !workshopLoaded()">
          {{ saving() ? (editing() ? 'Saving…' : 'Creating…') : (editing() ? 'Save changes' : 'Create') }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    ngx-particle-header h1 {
      font-size: 1.85rem;
      font-weight: 100;
      margin: 1.7rem 0;
      padding: 0 1rem;
    }
    form {
      max-width: 960px;
      margin: auto;
      padding: 24px;
    }
    fieldset {
      border: 0;
      padding: 0;
      margin: 0;
      min-width: 0;
    }
    mat-form-field { width: 100%; margin-top: 8px; }
    [role='alert'] { color: var(--mat-sys-error); }
    .image-preview { display: block; max-width: 100%; max-height: 240px; }
    .asset-manager-wrapper { margin-top: 1rem; }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 24px;
    }
    .action-bar {
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
  `],
})
export class CreateWorkshopComponent {
  private readonly editor = inject(WorkshopEditorService);
  private readonly navigation = inject(NavigationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly assets = inject(DocumentAssetsService);
  private readonly workshopReload = new Subject<void>();
  private readonly sectionId = signal('');
  private readonly workshopId = signal<string | null>(null);
  private readonly sortId = signal(0);
  readonly editing = computed(() => this.workshopId() !== null);
  readonly loadingWorkshop = signal(false);
  readonly workshopLoaded = signal(false);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal('');
  readonly assetSelected = signal<Asset | null>(null);
  readonly assetSelectionError = signal('');
  readonly assetFolder = signal<AssetFolder | null>(null);
  readonly loadingAssetFolder = signal(false);
  readonly assetFolderError = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    summary: ['', [Validators.required, Validators.pattern(/\S/)]],
    thumbnail: [''],
  });

  constructor() {
    combineLatest([
      this.route.paramMap,
      this.workshopReload.pipe(startWith(undefined)),
    ]).pipe(
      switchMap(([params]) => {
        const sectionId = params.get('section') ?? '';
        const workshopId = params.get('workshopId');
        this.sectionId.set(sectionId);
        this.workshopId.set(workshopId);
        this.workshopLoaded.set(false);
        this.saved.set(false);
        this.error.set('');
        this.assetSelected.set(null);
        this.assetSelectionError.set('');
        this.form.reset({ name: '', summary: '', thumbnail: '' });
        this.form.controls.thumbnail.setValidators(
          workshopId === null ? [] : [Validators.required, Validators.pattern(/\S/)]
        );
        this.form.controls.thumbnail.updateValueAndValidity();
        this.loadingWorkshop.set(true);
        return this.navigation.getSections().pipe(
          take(1),
          switchMap((sections) => {
            if (!sections.some((section) => section._id === sectionId)) {
              this.error.set('This section no longer exists.');
              return of(null);
            }
            return this.navigation.navigateToSection(sectionId, true);
          }),
          catchError((error: { status?: number }) => {
            this.error.set(this.requestError(error, 'load'));
            return of(null);
          }),
          finalize(() => this.loadingWorkshop.set(false))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((workshops) => {
      if (workshops === null) return;
      const id = this.workshopId();
      this.sortId.set(workshops.length);
      if (id !== null) {
        const workshop = workshops.find((item) => item._id === id);
        if (!workshop) {
          this.error.set('This workshop no longer exists in this section.');
          return;
        }
        this.form.reset({
          name: workshop.name,
          summary: workshop.summary,
          thumbnail: workshop.thumbnail,
        });
      }
      this.workshopLoaded.set(true);
    });
    this.loadAssetFolder();
  }

  retryWorkshop(): void {
    if (!this.loadingWorkshop() && !this.saving() && !this.saved()) {
      this.workshopReload.next();
    }
  }

  loadAssetFolder(): void {
    if (this.loadingAssetFolder()) return;
    this.loadingAssetFolder.set(true);
    this.assetFolderError.set('');
    this.assets.findDocumentsFolder().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loadingAssetFolder.set(false))
    ).subscribe({
      next: (folder) => this.assetFolder.set(folder),
      error: (error: unknown) => this.assetFolderError.set(
        error instanceof DocumentsAssetFolderNotFoundError
          ? error.message
          : assetErrorMessage(error)
      ),
    });
  }

  selectAsset(asset: Asset): void {
    this.assetSelected.set(asset);
    this.assetSelectionError.set('');
  }

  useSelectedAsset(): void {
    if (this.saving() || this.saved() || !this.workshopLoaded()) return;
    const asset = this.assetSelected();
    const url = asset && assetPreviewUrl(asset);
    if (!url) {
      this.assetSelectionError.set(
        'This image has no usable URL. Enter an image URL manually or select another image.'
      );
      return;
    }
    this.assetSelectionError.set('');
    this.form.controls.thumbnail.setValue(url);
    this.form.controls.thumbnail.markAsDirty();
  }

  save(): void {
    if (this.saving() || this.saved()) return;
    if (!this.workshopLoaded()) {
      this.error.set(this.error() || 'Load the workshop details before saving.');
      return;
    }
    const values = this.form.getRawValue();
    this.form.setValue({
      name: values.name.trim(),
      summary: values.summary.trim(),
      thumbnail: values.thumbnail.trim(),
    });
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const id = this.workshopId();
    const metadata = this.form.getRawValue();
    const request = id === null
      ? this.editor.createWorkshop({
          ...metadata,
          sectionId: this.sectionId(),
          sortId: this.sortId(),
        })
      : this.editor.editWorkshopNameAndSummary({ ...metadata, _id: id });
    request.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: ({ success }) => {
        if (!success) {
          this.error.set('The server did not confirm the workshop save. Please try again.');
          return;
        }
        this.navigation.addWorkshop(success);
        this.saved.set(true);
        this.saving.set(false);
        this.returnToWorkshops();
      },
      error: (error: { status?: number }) =>
        this.error.set(this.requestError(error, 'save')),
    });
  }

  returnToWorkshops(): void {
    if (this.saving()) return;
    const message = this.saved()
      ? 'The workshop was saved, but navigation failed. Use Back to Workshops to try again.'
      : 'Could not return to workshops. Please try again.';
    void this.router.navigate(
      [this.sectionId(), 'workshop-list'],
      { relativeTo: this.route.parent }
    ).then(
      (navigated) => { if (!navigated) this.error.set(message); },
      () => this.error.set(message)
    );
  }

  private requestError(error: { status?: number }, action: 'load' | 'save'): string {
    if (error.status === 401 || error.status === 403) {
      return 'You need administrator access to create or edit workshops.';
    }
    if (error.status === 404) {
      return 'This workshop or section no longer exists. Your changes have not been saved.';
    }
    return action === 'load'
      ? 'Could not load the workshop details. Please try again.'
      : `Could not ${this.editing() ? 'save' : 'create'} the workshop. Please try again.`;
  }
}
