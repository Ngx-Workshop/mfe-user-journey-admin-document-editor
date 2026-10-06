import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';

export type PageForm = FormGroup<{
  name: FormControl<string>;
  pageType: FormControl<'PAGE' | 'EXAM'>;
}>;

@Component({
  selector: 'ngx-page-form',
  imports: [
    ReactiveFormsModule, MatButtonModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatRadioModule,
  ],
  template: `
    <div class="page-form__toolbar">
      <button matButton="filled" type="button" [disabled]="saving()" (click)="back.emit()">
        <mat-icon>arrow_back</mat-icon>Back to Workshop
      </button>
    </div>
    <main class="page-form">
      <h1>{{ editing() ? 'Edit Page' : 'Create Page' }}</h1>
      @if (loading()) {
        <p role="status">Loading page details...</p>
      }
      @if (error()) {
        <p class="page-form__error" role="alert">{{ error() }}</p>
        @if (!loaded() && !loading()) {
          <button matButton type="button" (click)="retry.emit()">Retry loading</button>
        }
      }
      @if (loaded()) {
        <form [formGroup]="form()" (ngSubmit)="save.emit()" [attr.aria-busy]="saving()">
          <mat-form-field class="page-form__field">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" autocomplete="off" />
            <mat-error>Enter a page name.</mat-error>
          </mat-form-field>
          @if (!editing()) {
            <mat-radio-group class="page-form__types" formControlName="pageType"
              aria-label="Page type">
              <mat-radio-button value="PAGE">Workshop Page</mat-radio-button>
              <mat-radio-button value="EXAM">Workshop Exam</mat-radio-button>
            </mat-radio-group>
          }
          <div class="page-form__actions">
            <button matButton type="button" [disabled]="saving()" (click)="back.emit()">
              {{ saved() ? 'Return to Workshop' : 'Cancel' }}
            </button>
            <button matButton="filled" type="submit"
              [disabled]="form().invalid || saving() || saved()">
              {{ saving() ? 'Saving...' : editing() ? 'Save' : 'Create' }}
            </button>
          </div>
        </form>
      }
    </main>
  `,
  styles: [`
    .page-form { max-width: 720px; margin: 0 auto; padding: 24px; }
    .page-form__toolbar {
      position: sticky;
      top: 56px;
      min-height: 56px;
      z-index: 5;
      display: flex;
      flex-wrap: wrap;
      width: 100%;
      background: var(--mat-sys-primary);
      align-items: center;
      button {
        color: var(--mat-sys-on-primary);
        background: var(--mat-sys-primary);
        margin: 0 12px;
      }
    }
    .page-form__field { width: 100%; }
    .page-form__types, .page-form__actions {
      display: flex; flex-wrap: wrap; gap: 16px; margin: 16px 0;
    }
    .page-form__actions { justify-content: flex-end; }
    .page-form__error { color: var(--mat-sys-error); }
  `],
})
export class PageFormComponent {
  readonly form = input.required<PageForm>();
  readonly editing = input(false);
  readonly loading = input(false);
  readonly loaded = input(false);
  readonly saving = input(false);
  readonly saved = input(false);
  readonly error = input('');
  readonly save = output<void>();
  readonly back = output<void>();
  readonly retry = output<void>();
}
