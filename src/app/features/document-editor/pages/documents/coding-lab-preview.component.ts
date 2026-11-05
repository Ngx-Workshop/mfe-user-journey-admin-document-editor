import { NgxCodeBlock } from '@tmdjr/ngx-workshop-design-system';
import { ChangeDetectionStrategy } from '@angular/core';
import { NgxButton } from '@tmdjr/ngx-workshop-design-system';
import { JsonPipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  inject,
  input,
  OnChanges,
  signal,
  SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { PublishedLabDto } from '@tmdjr/coding-labs-contracts';
import {
  catchError,
  map,
  of,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { CodingLabsApiService } from '../../api/coding-labs-api.service';
import { LabInstructionsComponent } from './lab-instructions.component';

type LabPreviewState = {
  loading: boolean;
  lab: PublishedLabDto | null;
  error: string;
};

@Component({
  host: { class: 'ngx-design-system ngx-document-design' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ngx-coding-lab-preview',
  imports: [NgxCodeBlock,NgxButton,
    JsonPipe,
    ReactiveFormsModule,
    MatButtonModule,
    LabInstructionsComponent,
  ],
  template: `
    <section
      class="lab-preview"
      aria-labelledby="lab-preview-title"
      [attr.aria-busy]="state().loading"
    >
      <p class="lab-preview__eyebrow">Coding Lab · Learner preview</p>
      <h2 id="lab-preview-title">{{ pageName() }}</h2>
      @if (state().loading) {
        <p role="status">Loading coding lab…</p>
      }
      @if (state().error) {
        <p role="alert">{{ state().error }}</p>
        <button mat-flat-button ngxButton surface="outline" type="button" (click)="retry()">
          Retry loading lab
        </button>
      }
      @if (state().lab; as lab) {
        <p>
          {{ lab.title }} · {{ lab.language }}
          @if (lab.difficulty) {
            · {{ lab.difficulty }}
          }
          · Version {{ lab.versionNumber }}
        </p>
        <div class="lab-preview__workspace">
          <div>
            <h3>Instructions</h3>
            @if (lab.promptMarkdown.trim()) {
              <ngx-lab-instructions [markdown]="lab.promptMarkdown" />
            } @else {
              <p>No instructions are available for this lab.</p>
            }
            @if (lab.hints.length) {
              <h3>Hints</h3>
              @for (hint of lab.hints; track $index) {
                <details class="lab-preview__hint">
                  <summary>Hint {{ $index + 1 }}</summary>
                  <ngx-lab-instructions [markdown]="hint" />
                </details>
              }
            }
            <h3>Examples</h3>
            @for (sample of lab.sampleTests; track $index) {
              <article class="lab-preview__example">
                <h4>{{ sample.name }}</h4>
                @if (sample.kind === 'io') {
                  <p>Input</p>
                  <ngx-code-block [code]="(sample.input | json) || 'null'" language="json" [wrap]="true" />
                  <p>Expected output</p>
                  <ngx-code-block [code]="(sample.expected | json) || 'null'" language="json" [wrap]="true" />
                } @else {
                  <ngx-code-block [code]="sample.testCode || ''" [language]="lab.language" [wrap]="true" />
                }
              </article>
            } @empty {
              <p>No sample tests are available for this lab.</p>
            }
          </div>
          <div>
            <label
              class="lab-preview__code-label"
              for="lab-preview-code"
              >Your code ({{ lab.language }})</label
            >
            @if (lab.entryFnName) {
              <p>
                Implement <code>{{ lab.entryFnName }}</code> to solve
                the challenge.
              </p>
            }
            <textarea
              id="lab-preview-code"
              class="lab-preview__code"
              [formControl]="code"
              spellcheck="false"
              autocomplete="off"
              autocapitalize="off"
              rows="18"
              aria-describedby="lab-preview-note"
            ></textarea>
            <p id="lab-preview-note">
              Code changes stay in this preview. Running code and
              submitting solutions are not available yet.
            </p>
            <button
              mat-flat-button ngxButton surface="outline"
              type="button"
              [disabled]="code.value === lab.starterCode"
              (click)="resetCode()"
            >
              Reset starter code
            </button>
          </div>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .lab-preview {
        padding: 8px;
        border-radius: var(--ngx-radius-sm);
        background: var(--ngx-color-surface);
        overflow-wrap: anywhere;
      }
      .lab-preview__eyebrow {
        color: var(--ngx-color-primary);
      }
      .lab-preview__workspace {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 12px;
      }
      .lab-preview__code-label {
        display: block;
        font-size: 1.15rem;
        font-weight: 600;
        margin: 16px 0;
      }
      .lab-preview__code {
        box-sizing: border-box;
        width: 100%;
        resize: vertical;
        min-height: 300px;
        padding: 16px;
        border: 1px solid var(--ngx-color-border);
        border-radius: 12px;
        font: 14px/1.6 monospace;
        tab-size: 2;
        color: var(--ngx-color-text);
        background: var(--ngx-color-canvas);
      }
      .lab-preview__code:focus-visible {
        outline: 2px solid var(--ngx-color-primary);
        outline-offset: 2px;
      }
      .lab-preview__hint,
      .lab-preview__example {
        padding: 12px;
        margin: 12px 0;
        border: 1px solid var(--ngx-color-border);
        border-radius: 8px;
      }
      .lab-preview__hint summary {
        cursor: pointer;
      }
      .lab-preview pre {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      @media (max-width: 1200px) {
        .lab-preview__workspace {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CodingLabPreviewComponent implements OnChanges {
  readonly resourceId = input.required<string>();
  readonly pageName = input.required<string>();
  readonly code = new FormControl('', { nonNullable: true });
  readonly state = signal<LabPreviewState>({
    loading: true,
    lab: null,
    error: '',
  });
  private readonly api = inject(CodingLabsApiService);
  private readonly reload = new Subject<string>();

  constructor() {
    this.reload
      .pipe(
        tap(() => {
          this.code.reset('');
          this.code.disable();
        }),
        switchMap((id) =>
          id
            ? this.api.getPublishedLab(id).pipe(
                map((lab) => ({ loading: false, lab, error: '' })),
                catchError((error: { status?: number }) =>
                  of({
                    loading: false,
                    lab: null,
                    error:
                      error.status === 404
                        ? 'This coding lab is unavailable or has no published version.'
                        : error.status === 401 || error.status === 403
                          ? 'You do not have access to this coding lab.'
                          : 'Could not load this coding lab. Please try again.',
                  })
                ),
                startWith({ loading: true, lab: null, error: '' })
              )
            : of({
                loading: false,
                lab: null,
                error: 'This page has no linked coding lab.',
              })
        ),
        takeUntilDestroyed(inject(DestroyRef))
      )
      .subscribe((state) => {
        this.state.set(state);
        if (state.lab) {
          this.code.reset(state.lab.starterCode);
          this.code.enable();
        }
      });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resourceId']) this.reload.next(this.resourceId());
  }
  retry(): void {
    if (!this.state().loading) this.reload.next(this.resourceId());
  }
  resetCode(): void {
    const lab = this.state().lab;
    if (lab) this.code.reset(lab.starterCode);
  }
}
