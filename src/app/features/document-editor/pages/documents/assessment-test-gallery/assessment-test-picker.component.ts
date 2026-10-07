import {
  Component,
  computed,
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
import { MatSelectModule } from '@angular/material/select';
import { AssessmentTestDto } from '@tmdjr/service-nestjs-assessment-test-contracts';
import {
  catchError,
  finalize,
  of,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';
import { AssessmentTestsApiService } from '../../../api/assessment-tests-api.service';
import { AssessmentTestGalleryComponent } from './assessment-test-gallery.component';

@Component({
  selector: 'ngx-assessment-test-picker',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    AssessmentTestGalleryComponent,
  ],
  template: `
    <section
      class="assessment-picker"
      aria-labelledby="assessment-picker-title"
      [attr.aria-busy]="loading()"
    >
      <h2 id="assessment-picker-title">Choose an assessment test</h2>
      <p>Link an existing test to this workshop.</p>
      <div class="assessment-picker__search">
        <mat-form-field class="assessment-picker__query">
          <mat-label>Search assessment tests</mat-label>
          <input
            matInput
            [formControl]="query"
            [readonly]="disabled()"
            (keydown.enter)="$event.preventDefault(); search()"
          />
        </mat-form-field>
        <mat-form-field class="assessment-picker__subject">
          <mat-label>Subject</mat-label>
          <mat-select
            [formControl]="subject"
            [disabled]="disabled() || loading()"
            (selectionChange)="search()"
          >
            <mat-option value="">All subjects</mat-option>
            <mat-option value="ANGULAR">Angular</mat-option>
            <mat-option value="NESTJS">NestJS</mat-option>
            <mat-option value="RXJS">RxJS</mat-option>
          </mat-select>
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
      @if (selectedTest(); as test) {
        <p class="assessment-picker__selection" role="status">
          Selected: <strong>{{ test.name }}</strong>
        </p>
      }
      @if (loading()) {
        <p role="status">Loading assessment tests…</p>
      }
      @if (error()) {
        <p class="assessment-picker__error" role="alert">
          {{ error() }}
        </p>
        <button
          matButton
          type="button"
          [disabled]="disabled() || loading()"
          (click)="retry()"
        >
          Retry loading tests
        </button>
      }
      @if (!loading() && !error() && filteredTests().length === 0) {
        <p>
          No assessment tests found. Try another search or subject.
        </p>
      }
      <ngx-assessment-test-gallery
        [tests]="visibleTests()"
        [selectedId]="selectedId()"
        [disabled]="disabled() || loading()"
        (selected)="choose($event)"
      />
      @if (hasMore() && !error()) {
        <button
          class="assessment-picker__more"
          matButton
          type="button"
          [disabled]="disabled() || loading()"
          (click)="loadMore()"
        >
          Load more tests
        </button>
      }
      @if (!selectedId()) {
        <p>Select an assessment test before creating the page.</p>
      }
    </section>
  `,
  styles: [
    `
      .assessment-picker {
        margin: 24px 0;
      }
      .assessment-picker__search {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
      }
      .assessment-picker__query {
        flex: 1 1 240px;
        min-width: 0;
      }
      .assessment-picker__subject {
        flex: 1 1 160px;
        min-width: 0;
      }
      .assessment-picker__selection {
        padding: 12px;
        border-radius: 8px;
        background: var(--mat-sys-secondary-container);
        color: var(--mat-sys-on-secondary-container);
      }
      .assessment-picker__error {
        color: var(--mat-sys-error);
      }
      .assessment-picker__more {
        margin-top: 16px;
      }
    `,
  ],
})
export class AssessmentTestPickerComponent {
  readonly selectedId = input('');
  readonly selectedTest = input<AssessmentTestDto | null>(null);
  readonly disabled = input(false);
  readonly selected = output<AssessmentTestDto>();
  readonly query = new FormControl('', { nonNullable: true });
  readonly subject = new FormControl<
    AssessmentTestDto['subject'] | ''
  >('', { nonNullable: true });
  readonly tests = signal<AssessmentTestDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  private readonly searchQuery = signal('');
  private readonly searchSubject = signal<
    AssessmentTestDto['subject'] | ''
  >('');
  private readonly pageSize = 24;
  private readonly visibleCount = signal(this.pageSize);
  readonly filteredTests = computed(() =>
    this.tests().filter(
      (test) =>
        (!this.searchSubject() ||
          test.subject === this.searchSubject()) &&
        `${test.name} ${test.subject} ${test.level}`
          .toLowerCase()
          .includes(this.searchQuery())
    )
  );
  readonly visibleTests = computed(() =>
    this.filteredTests().slice(0, this.visibleCount())
  );
  readonly hasMore = computed(
    () => this.filteredTests().length > this.visibleCount()
  );
  private readonly api = inject(AssessmentTestsApiService);
  private readonly reload = new Subject<void>();

  constructor() {
    this.reload
      .pipe(
        startWith(undefined),
        switchMap(() => {
          this.loading.set(true);
          this.error.set('');
          return this.api.listTests().pipe(
            catchError((error: { status?: number }) => {
              this.error.set(
                error.status === 401 || error.status === 403
                  ? 'Administrator access is required to browse assessment tests.'
                  : 'Could not load assessment tests. Please try again.'
              );
              return of(null);
            }),
            finalize(() => this.loading.set(false))
          );
        }),
        takeUntilDestroyed(inject(DestroyRef))
      )
      .subscribe((tests) => {
        if (tests)
          this.tests.set([
            ...new Map(
              tests.map((test) => [test._id, test])
            ).values(),
          ]);
      });
  }

  search(): void {
    if (this.disabled() || this.loading()) return;
    this.searchQuery.set(this.query.value.trim().toLowerCase());
    this.searchSubject.set(this.subject.value);
    this.visibleCount.set(this.pageSize);
  }
  loadMore(): void {
    if (!this.disabled() && !this.loading() && this.hasMore())
      this.visibleCount.update((count) => count + this.pageSize);
  }
  retry(): void {
    if (!this.disabled() && !this.loading()) this.reload.next();
  }
  choose(test: AssessmentTestDto): void {
    if (!this.disabled() && !this.loading()) this.selected.emit(test);
  }
}
