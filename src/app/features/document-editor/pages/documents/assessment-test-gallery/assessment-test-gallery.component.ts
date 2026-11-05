import { ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AssessmentTestDto } from '@tmdjr/service-nestjs-assessment-test-contracts';

@Component({
  host: { class: 'ngx-design-system ngx-document-design' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ngx-assessment-test-gallery',
  imports: [MatIconModule, DatePipe],
  template: `
    <div
      class="assessment-gallery"
      role="group"
      aria-label="Choose an assessment test"
    >
      @for (test of tests(); track test._id) {
        <button
          type="button"
          class="assessment-gallery__card"
          [class.assessment-gallery__card--selected]="
            selectedId() === test._id
          "
          [attr.aria-pressed]="selectedId() === test._id"
          [attr.aria-label]="'Select ' + test.name"
          [disabled]="disabled()"
          (click)="selected.emit(test)"
        >
          <span class="assessment-gallery__top">
            <mat-icon aria-hidden="true">{{
              selectedId() === test._id ? 'check_circle' : 'quiz'
            }}</mat-icon>
            <span class="assessment-gallery__status">{{
              test.subject
            }}</span>
          </span>
          <span class="assessment-gallery__title">{{
            test.name
          }}</span>
          <span class="assessment-gallery__meta">
            <span>Level {{ test.level }}</span>
            <span
              >{{ test.testQuestions.length }}
              {{
                test.testQuestions.length === 1
                  ? 'question'
                  : 'questions'
              }}</span
            >
          </span>
          @if (test.lastUpdated) {
            <span class="assessment-gallery__meta"
              >Updated
              {{ test.lastUpdated | date: 'mediumDate' }}</span
            >
          }
          <span class="assessment-gallery__action">{{
            selectedId() === test._id ? 'Selected' : 'Select test'
          }}</span>
        </button>
      }
    </div>
  `,
  styles: [
    `
      .assessment-gallery {
        display: grid;
        grid-template-columns: repeat(
          auto-fit,
          minmax(min(100%, 270px), 1fr)
        );
        gap: 16px;
      }
      .assessment-gallery__card {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 10px;
        text-align: left;
        font: inherit;
        color: var(--ngx-color-text);
        background: var(--ngx-color-surface);
        border: 2px solid var(--ngx-color-border);
        border-radius: var(--ngx-radius-sm);
        cursor: pointer;
        overflow-wrap: anywhere;
      }
      .assessment-gallery__card:hover:not(:disabled),
      .assessment-gallery__card--selected {
        border-color: var(--ngx-color-primary);
      }
      .assessment-gallery__card--selected {
        background: var(--ngx-color-surface-high);
        color: var(--ngx-color-text);
      }
      .assessment-gallery__card:focus-visible {
        outline: 3px solid var(--ngx-color-primary);
        outline-offset: 3px;
      }
      .assessment-gallery__card:disabled {
        cursor: default;
        opacity: 0.65;
      }
      .assessment-gallery__top,
      .assessment-gallery__meta {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .assessment-gallery__top {
        justify-content: space-between;
      }
      .assessment-gallery__title {
        font-size: 1.1rem;
        font-weight: 600;
      }
      .assessment-gallery__meta,
      .assessment-gallery__status {
        font-size: 0.85rem;
      }
      .assessment-gallery__action {
        margin-top: auto;
        font-weight: 600;
      }
    `,
  ],
})
export class AssessmentTestGalleryComponent {
  readonly tests = input.required<AssessmentTestDto[]>();
  readonly selectedId = input('');
  readonly disabled = input(false);
  readonly selected = output<AssessmentTestDto>();
}
