import {
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  ActivatedRoute,
  Router,
  RouterModule,
} from '@angular/router';
import { NgxParticleHeader } from '@tmdjr/ngx-shared-headers';
import {
  catchError,
  combineLatest,
  finalize,
  of,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';
import { NavigationService } from '../../services/navigation.service';
import { WorkshopEditorService } from '../../services/workshops.service';
import {
  IsDeviconPipe,
  MenuDeviconComponent,
} from '../devicon.component';
import { DocumentImagePickerButtonComponent } from '../document-image-picker/document-image-picker-button.component';

@Component({
  selector: 'ngx-create-section',
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
      <h1>{{ editing() ? 'Edit Section' : 'Create Section' }}</h1>
    </ngx-particle-header>
    <div class="action-bar">
      <a
        [routerLink]="editing() ? '../../' : '../'"
        matButton="filled"
      >
        <mat-icon>arrow_back</mat-icon> Back to Sections</a
      >
    </div>
    @if (loadingSection()) {
    <p role="status">Loading section…</p>
    }
    <form
      [formGroup]="form"
      (ngSubmit)="create()"
      [attr.aria-busy]="saving()"
    >
      <fieldset
        [disabled]="
          saving() || created() || (editing() && !sectionLoaded())
        "
      >
        <mat-form-field appearance="outline">
          <mat-label>Section name</mat-label>
          <input
            matInput
            formControlName="sectionTitle"
            maxlength="120"
          />
          <mat-hint>For example, TypeScript or Testing</mat-hint>
          <mat-error
            >Enter a section name of 1–120 characters.</mat-error
          >
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Section description</mat-label>
          <textarea
            matInput
            formControlName="sectionDescription"
            rows="4"
          ></textarea>
          <mat-hint>Describe the workshops in this section.</mat-hint>
        </mat-form-field>

        @if (form.controls.menuSvgPath.value) { @if
        (form.controls.menuSvgPath.value | isDevicon) {
        <ngx-menu-devicon
          class="icon-preview"
          role="img"
          aria-label="Section menu image preview"
          [icon]="form.controls.menuSvgPath.value"
          [large]="true"
        />
        } @else {
        <img
          class="image-preview menu-image-preview"
          [src]="form.controls.menuSvgPath.value"
          alt="Sections Menu Image Preview"
          onerror="this.onerror=null; this.src='https://ngx-workshop-assets.sfo3.digitaloceanspaces.com/uploads/88322ab2-0f74-4539-b500-5a08430e4750.png';"
        />

        } }

        <mat-form-field appearance="outline">
          <mat-label>Menu image or Devicon</mat-label>
          <input matInput formControlName="menuSvgPath" />
          <ngx-document-image-picker-button
            matSuffix
            label="Choose menu image"
            [disabled]="
              saving() || created() || (editing() && !sectionLoaded())
            "
            (imageSelected)="setImage('menuSvgPath', $event)"
          />
          <mat-hint
            >Image URL/path or Devicon classes, e.g.
            devicon-angular-plain colored. Leave blank for default
            artwork.</mat-hint
          >
        </mat-form-field>

        @if (form.controls.headerSvgPath.value) { @if
        (form.controls.headerSvgPath.value | isDevicon) {
        <ngx-menu-devicon
          class="icon-preview"
          role="img"
          aria-label="Section header image preview"
          [icon]="form.controls.headerSvgPath.value"
          [large]="true"
        />
        } @else {
        <img
          class="image-preview header-image-preview"
          [src]="form.controls.headerSvgPath.value"
          alt="Sections header image preview"
          onerror="this.onerror=null; this.src='https://ngx-workshop-assets.sfo3.digitaloceanspaces.com/uploads/88322ab2-0f74-4539-b500-5a08430e4750.png';"
        />

        } }
        <mat-form-field appearance="outline">
          <mat-label>Header image or Devicon</mat-label>
          <input matInput formControlName="headerSvgPath" />
          <ngx-document-image-picker-button
            matSuffix
            label="Choose header image"
            [disabled]="
              saving() || created() || (editing() && !sectionLoaded())
            "
            (imageSelected)="setImage('headerSvgPath', $event)"
          />
          <mat-hint
            >Image URL/path or Devicon classes. Used in the section
            catalog and header.</mat-hint
          >
        </mat-form-field>
      </fieldset>
      @if (error()) {
      <p role="alert">{{ error() }}</p>
      @if (editing() && !sectionLoaded() && !loadingSection()) {
      <button matButton type="button" (click)="retrySection()">
        Retry loading section
      </button>
      } }
      <div class="form-actions">
        <button
          matButton
          type="button"
          (click)="returnToSections()"
          [disabled]="saving()"
        >
          {{ created() ? 'Back to Sections' : 'Cancel' }}
        </button>
        <button
          matButton="filled"
          type="submit"
          [disabled]="
            form.invalid ||
            saving() ||
            created() ||
            (editing() && !sectionLoaded())
          "
        >
          {{
            editing()
              ? saving()
                ? 'Saving…'
                : 'Save changes'
              : saving()
              ? 'Creating…'
              : 'Create'
          }}
        </button>
      </div>
    </form>
  `,
  styles: [
    `
      ngx-particle-header h1 {
        font-size: 1.85rem;
        font-weight: 100;
        margin: 1.7rem 0;
        padding: 0 1rem;
      }

      form {
        display: block;
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
      mat-form-field {
        width: 100%;
        margin-top: 8px;
      }
      [role='alert'] {
        color: var(--mat-sys-error);
      }
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
      }
      .action-bar {
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
      .image-preview,
      .icon-preview {
        display: block;
        max-width: 100%;
        max-height: 240px;
        margin: 1rem 0;
      }
    `,
  ],
})
export class CreateSectionComponent {
  private readonly editor = inject(WorkshopEditorService);
  private readonly navigation = inject(NavigationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sectionReload = new Subject<void>();
  private readonly sectionId = signal<string | null>(null);
  readonly editing = computed(() => this.sectionId() !== null);
  readonly loadingSection = signal(false);
  readonly sectionLoaded = signal(false);
  readonly saving = signal(false);
  readonly created = signal(false);
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
    sectionDescription: [''],
    menuSvgPath: [''],
    headerSvgPath: [''],
  });

  constructor() {
    combineLatest([
      this.route.paramMap,
      this.sectionReload.pipe(startWith(undefined)),
    ])
      .pipe(
        switchMap(([params]) => {
          const id = params.get('sectionId');
          this.sectionId.set(id);
          this.sectionLoaded.set(false);
          this.created.set(false);
          this.error.set('');
          this.form.reset({
            sectionTitle: '',
            sectionDescription: '',
            menuSvgPath: '',
            headerSvgPath: '',
          });
          if (id === null) return of(null);
          this.loadingSection.set(true);
          return this.editor.getSection(id).pipe(
            catchError((error: { status?: number }) => {
              this.error.set(
                error.status === 404
                  ? 'This section no longer exists.'
                  : error.status === 401 || error.status === 403
                  ? 'You need administrator access to edit a section.'
                  : 'Could not load the section. Please try again.'
              );
              return of(null);
            }),
            finalize(() => this.loadingSection.set(false))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((section) => {
        if (!section) return;
        this.form.reset({
          sectionTitle: section.sectionTitle,
          sectionDescription: section.sectionDescription,
          menuSvgPath: section.menuSvgPath,
          headerSvgPath: section.headerSvgPath,
        });
        this.sectionLoaded.set(true);
      });
  }

  retrySection(): void {
    if (!this.loadingSection() && !this.saving() && !this.created()) {
      this.sectionReload.next();
    }
  }

  create(): void {
    if (this.saving() || this.created()) return;
    if (this.editing() && !this.sectionLoaded()) {
      this.error.set(
        this.error() || 'Load the section before saving changes.'
      );
      return;
    }
    this.form.controls.sectionTitle.setValue(
      this.form.controls.sectionTitle.value.trim()
    );
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const values = {
      ...this.form.getRawValue(),
      sectionDescription:
        this.form.controls.sectionDescription.value.trim(),
      menuSvgPath: this.form.controls.menuSvgPath.value.trim(),
      headerSvgPath: this.form.controls.headerSvgPath.value.trim(),
    };
    const id = this.sectionId();
    const request =
      id === null
        ? this.editor.createSection(values)
        : this.editor.updateSection(id, values);
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: (section) => {
          this.navigation.addSection(section);
          this.created.set(true);
          this.saving.set(false);
          this.returnToSections();
        },
        error: (error: { status?: number }) =>
          this.error.set(
            error.status === 401 || error.status === 403
              ? `You need administrator access to ${
                  this.editing() ? 'edit' : 'create'
                } a section.`
              : error.status === 404 && this.editing()
              ? 'This section no longer exists. Your changes have not been saved.'
              : `Could not ${
                  this.editing() ? 'save' : 'create'
                } the section. Please try again.`
          ),
      });
  }

  setImage(
    field: 'menuSvgPath' | 'headerSvgPath',
    url: string
  ): void {
    if (
      this.saving() ||
      this.created() ||
      (this.editing() && !this.sectionLoaded())
    )
      return;
    this.form.controls[field].setValue(url);
    this.form.controls[field].markAsDirty();
  }

  returnToSections(): void {
    if (this.saving()) return;
    const message = this.created()
      ? `The section was ${
          this.editing() ? 'saved' : 'created'
        }, but navigation failed. Use Back to Sections to try again.`
      : 'Could not return to sections. Please try again.';
    void this.router
      .navigate(['.'], { relativeTo: this.route.parent })
      .then(
        (navigated) => {
          if (!navigated) this.error.set(message);
        },
        () => this.error.set(message)
      );
  }
}
