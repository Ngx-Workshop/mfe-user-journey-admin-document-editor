import {
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HandsOnLabMongo } from '@tmdjr/coding-labs-contracts';
import { catchError, finalize, of, Subject, switchMap } from 'rxjs';
import { CodingLabsApiService } from '../../../api/coding-labs-api.service';
import { CodingLabGalleryComponent } from './coding-lab-gallery.component';

type CatalogRequest = {
  query: string;
  skip: number;
  append: boolean;
};

@Component({
  selector: 'ngx-coding-lab-picker',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    CodingLabGalleryComponent,
  ],
  template: `
    <section
      class="lab-picker"
      aria-labelledby="lab-picker-title"
      [attr.aria-busy]="loading()"
    >
      <h2 id="lab-picker-title">Choose a coding lab</h2>
      <p>
        Link an existing lab to this workshop. Draft labs are
        labelled.
      </p>
      <div class="lab-picker__search">
        <mat-form-field class="lab-picker__query">
          <mat-label>Search coding labs</mat-label>
          <input
            matInput
            [formControl]="query"
            [readonly]="disabled()"
            (keydown.enter)="$event.preventDefault(); search()"
          />
        </mat-form-field>
        <button
          matButton
          type="button"
          [disabled]="disabled() || loading()"
          (click)="search()"
        >
          Search
        </button>
      </div>
      @if (selectedLab(); as lab) {
        <p class="lab-picker__selection" role="status">
          Selected: <strong>{{ lab.title }}</strong>
        </p>
      }
      @if (loading()) {
        <p role="status">Loading coding labs…</p>
      }
      @if (error()) {
        <p class="lab-picker__error" role="alert">{{ error() }}</p>
        <button
          matButton
          type="button"
          [disabled]="disabled() || loading()"
          (click)="retry()"
        >
          Retry loading labs
        </button>
      }
      @if (!loading() && !error() && labs().length === 0) {
        <p>No coding labs found. Try another search.</p>
      }
      <ngx-coding-lab-gallery
        [labs]="labs()"
        [selectedId]="selectedId()"
        [disabled]="disabled() || loading()"
        (selected)="choose($event)"
      />
      @if (hasMore() && !error()) {
        <button
          class="lab-picker__more"
          matButton
          type="button"
          [disabled]="disabled() || loading()"
          (click)="loadMore()"
        >
          Load more labs
        </button>
      }
      @if (!selectedId()) {
        <p>Select a coding lab before creating the page.</p>
      }
    </section>
  `,
  styles: [
    `
      .lab-picker {
        margin: 24px 0;
      }
      .lab-picker__search {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .lab-picker__query {
        flex: 1;
        min-width: 0;
      }
      .lab-picker__selection {
        padding: 12px;
        border-radius: 8px;
        background: var(--mat-sys-secondary-container);
        color: var(--mat-sys-on-secondary-container);
      }
      .lab-picker__error {
        color: var(--mat-sys-error);
      }
      .lab-picker__more {
        margin-top: 16px;
      }
    `,
  ],
})
export class CodingLabPickerComponent {
  readonly selectedId = input('');
  readonly selectedLab = input<HandsOnLabMongo | null>(null);
  readonly disabled = input(false);
  readonly selected = output<HandsOnLabMongo>();
  readonly query = new FormControl('', { nonNullable: true });
  readonly labs = signal<HandsOnLabMongo[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly hasMore = signal(false);
  private readonly api = inject(CodingLabsApiService);
  private readonly requests = new Subject<CatalogRequest>();
  private readonly pageSize = 24;
  private current: CatalogRequest = {
    query: '',
    skip: 0,
    append: false,
  };

  constructor() {
    this.requests
      .pipe(
        switchMap((request) => {
          this.current = request;
          this.loading.set(true);
          this.error.set('');
          if (!request.append) this.labs.set([]);
          return this.api
            .listLabs(request.query, request.skip, this.pageSize)
            .pipe(
              catchError((error: { status?: number }) => {
                this.error.set(
                  error.status === 401 || error.status === 403
                    ? 'Administrator access is required to browse coding labs.'
                    : 'Could not load coding labs. Please try again.'
                );
                return of(null);
              }),
              finalize(() => this.loading.set(false))
            );
        }),
        takeUntilDestroyed(inject(DestroyRef))
      )
      .subscribe((labs) => {
        if (!labs) return;
        this.hasMore.set(labs.length === this.pageSize);
        const available = labs.filter(
          (lab) => lab.status !== 'archived'
        );
        const merged = this.current.append
          ? [...this.labs(), ...available]
          : available;
        this.labs.set([
          ...new Map(merged.map((lab) => [lab._id, lab])).values(),
        ]);
      });
    this.requests.next(this.current);
  }

  search(): void {
    if (this.disabled() || this.loading()) return;
    this.requests.next({
      query: this.query.value.trim(),
      skip: 0,
      append: false,
    });
  }
  loadMore(): void {
    if (this.disabled() || this.loading() || !this.hasMore()) return;
    this.requests.next({
      query: this.current.query,
      skip: this.current.skip + this.pageSize,
      append: true,
    });
  }
  retry(): void {
    if (!this.disabled() && !this.loading())
      this.requests.next(this.current);
  }
  choose(lab: HandsOnLabMongo): void {
    if (
      !this.disabled() &&
      !this.loading() &&
      lab.status !== 'archived'
    )
      this.selected.emit(lab);
  }
}
