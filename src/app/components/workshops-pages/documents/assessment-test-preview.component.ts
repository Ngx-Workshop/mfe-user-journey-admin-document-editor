import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnChanges,
  signal,
  SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { AssessmentTestDto } from '@tmdjr/service-nestjs-assessment-test-contracts';
import {
  catchError,
  map,
  of,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { AssessmentTestsApiService } from '../../../services/assessment-tests-api.service';

type PreviewState = {
  loading: boolean;
  test: AssessmentTestDto | null;
  error: string;
};

@Component({
  selector: 'ngx-assessment-test-preview',
  imports: [MatButtonModule, MatRadioModule],
  template: `
    <section
      class="assessment-preview"
      aria-labelledby="assessment-preview-title"
      [attr.aria-busy]="state().loading"
    >
      <p class="assessment-preview__eyebrow">
        Assessment Test · Learner preview
      </p>
      <h2 id="assessment-preview-title">{{ pageName() }}</h2>
      <p>
        Practice the learner experience. Your answers and results are
        not saved.
      </p>
      @if (state().loading) {
      <p role="status">Loading assessment test…</p>
      } @if (state().error) {
      <p role="alert">{{ state().error }}</p>
      <button matButton type="button" (click)="retry()">
        Retry loading test
      </button>
      } @if (state().test; as test) {
      <p>
        {{ test.name }} · {{ test.subject }} · Level
        {{ test.level }} · {{ test.testQuestions.length }} questions
      </p>
      @if (!test.testQuestions.length) {
      <p>This test has no questions yet.</p>
      } @else if (!started()) {
      <p>
        Choose one answer for each question. You can review your
        answers before finishing.
      </p>
      <button
        matButton="filled"
        type="button"
        (click)="started.set(true)"
      >
        Start preview
      </button>
      } @else if (submitted()) {
      <div class="assessment-preview__result" role="status">
        <h3>Preview complete</h3>
        <p>
          {{ score() }} of {{ test.testQuestions.length }} correct
        </p>
      </div>
      @for (question of test.testQuestions; track $index; let index =
      $index) {
      <article class="assessment-preview__review">
        <h3>{{ index + 1 }}. {{ question.question }}</h3>
        <p>Your answer: {{ answers()[index] }}</p>
        <p>
          {{
            answers()[index] === question.answer
              ? 'Correct'
              : 'Incorrect'
          }}
        </p>
        @if (answers()[index] !== question.answer) {
        <p>Correct answer: {{ question.answer }}</p>
        }
        <p>
          {{
            answers()[index] === question.answer
              ? question.correctResponse
              : question.incorrectResponse
          }}
        </p>
      </article>
      }
      <button matButton="filled" type="button" (click)="restart()">
        Try again
      </button>
      } @else {
      <p role="status">
        {{ answeredCount() }} of
        {{ test.testQuestions.length }} answered
      </p>
      <progress
        class="assessment-preview__progress"
        [value]="answeredCount()"
        [max]="test.testQuestions.length"
        aria-label="Questions answered"
      ></progress>
      <form (submit)="$event.preventDefault(); finish()">
        @for (question of test.testQuestions; track $index; let index
        = $index) {
        <fieldset class="assessment-preview__question">
          <legend [id]="'assessment-question-' + index">
            {{ index + 1 }}. {{ question.question }}
          </legend>
          <mat-radio-group
            class="assessment-preview__choices"
            [attr.aria-labelledby]="'assessment-question-' + index"
            [value]="answers()[index] ?? null"
            (change)="answer(index, $event.value)"
          >
            @for (choice of question.choices; track $index) {
            <mat-radio-button [value]="choice.value">{{
              choice.value
            }}</mat-radio-button>
            }
          </mat-radio-group>
        </fieldset>
        }
        <p>Answer every question to see your results.</p>
        <button
          matButton="filled"
          type="submit"
          [disabled]="!complete()"
        >
          Finish preview
        </button>
        <button matButton type="button" (click)="restart()">
          Start over
        </button>
      </form>
      } }
    </section>
  `,
  styles: [
    `
      :host {
        display: flex;
        justify-content: space-around;
        margin-top: 24px;
        min-width: 0;
      }
      .assessment-preview {
        background: var(--mat-sys-surface-container-low);
        padding: 1.5rem;
        border-radius: var(--mat-sys-corner-medium);
        margin-bottom: 2rem;
        max-width: 750px;
        min-width: 0;
      }
      .assessment-preview__eyebrow {
        color: var(--mat-sys-primary);
      }
      .assessment-preview__progress {
        width: 100%;
        accent-color: var(--mat-sys-primary);
      }
      .assessment-preview__question {
        margin: 24px 0;
        padding: 16px;
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 12px;
        min-width: 0;
      }
      .assessment-preview__question legend {
        padding: 0 8px;
        font-weight: 600;
        white-space: pre-wrap;
      }
      .assessment-preview__choices {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .assessment-preview__review {
        padding: 16px 0;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
        white-space: pre-wrap;
      }
      .assessment-preview__result {
        padding: 16px;
        border-radius: 12px;
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
      }
      button {
        margin: 8px 8px 0 0;
      }
    `,
  ],
})
export class AssessmentTestPreviewComponent implements OnChanges {
  readonly resourceId = input.required<string>();
  readonly pageName = input.required<string>();
  readonly started = signal(false);
  readonly submitted = signal(false);
  readonly answers = signal<Partial<Record<number, string>>>({});
  private readonly api = inject(AssessmentTestsApiService);
  private readonly reload = new Subject<string>();
  readonly state = signal<PreviewState>({
    loading: true,
    test: null,
    error: '',
  });

  constructor() {
    this.reload
      .pipe(
        tap(() => this.reset()),
        switchMap((id) =>
          id
            ? this.api.getTest(id).pipe(
                map((test) => ({ loading: false, test, error: '' })),
                catchError((error: { status?: number }) =>
                  of({
                    loading: false,
                    test: null,
                    error:
                      error.status === 404
                        ? 'This linked assessment test is no longer available.'
                        : error.status === 401 || error.status === 403
                        ? 'Administrator access is required to preview this assessment.'
                        : 'Could not load this assessment test. Please try again.',
                  })
                ),
                startWith({ loading: true, test: null, error: '' })
              )
            : of({
                loading: false,
                test: null,
                error: 'This page has no linked assessment test.',
              })
        ),
        takeUntilDestroyed(inject(DestroyRef))
      )
      .subscribe((state) => this.state.set(state));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resourceId']) this.reload.next(this.resourceId());
  }
  readonly answeredCount = computed(
    () => Object.keys(this.answers()).length
  );
  readonly complete = computed(() => {
    const questions = this.state().test?.testQuestions ?? [];
    return (
      questions.length > 0 &&
      questions.every((question, index) =>
        question.choices.some(
          (choice) => choice.value === this.answers()[index]
        )
      )
    );
  });
  readonly score = computed(
    () =>
      this.state().test?.testQuestions.filter(
        (question, index) => question.answer === this.answers()[index]
      ).length ?? 0
  );

  answer(index: number, value: string): void {
    if (!this.started() || this.submitted()) return;
    const question = this.state().test?.testQuestions[index];
    if (question?.choices.some((choice) => choice.value === value))
      this.answers.update((answers) => ({
        ...answers,
        [index]: value,
      }));
  }
  finish(): void {
    if (this.started() && this.complete()) this.submitted.set(true);
  }
  restart(): void {
    this.reset();
    this.started.set(true);
  }
  retry(): void {
    if (!this.state().loading) this.reload.next(this.resourceId());
  }
  private reset(): void {
    this.started.set(false);
    this.submitted.set(false);
    this.answers.set({});
  }
}
