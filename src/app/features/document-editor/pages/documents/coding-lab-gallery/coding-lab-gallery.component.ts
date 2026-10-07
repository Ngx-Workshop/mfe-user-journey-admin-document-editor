import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { HandsOnLabMongo } from '@tmdjr/coding-labs-contracts';

@Component({
  selector: 'ngx-coding-lab-gallery',
  imports: [MatIconModule],
  template: `
    <div
      class="lab-gallery"
      role="group"
      aria-label="Choose a coding lab"
    >
      @for (lab of labs(); track lab._id) {
        <button
          type="button"
          class="lab-gallery__card"
          [class.lab-gallery__card--selected]="
            selectedId() === lab._id
          "
          [attr.aria-pressed]="selectedId() === lab._id"
          [attr.aria-label]="'Select ' + lab.title"
          [disabled]="disabled()"
          (click)="selected.emit(lab)"
        >
          <span class="lab-gallery__top">
            <mat-icon aria-hidden="true">{{
              selectedId() === lab._id ? 'check_circle' : 'code'
            }}</mat-icon>
            <span class="lab-gallery__status">{{
              lab.status === 'published' ? 'Published' : 'Draft'
            }}</span>
          </span>
          <span class="lab-gallery__title">{{ lab.title }}</span>
          @if (lab.summary) {
            <span class="lab-gallery__summary">{{
              lab.summary
            }}</span>
          }
          <span class="lab-gallery__meta">
            @if (lab.difficulty) {
              <span>{{ lab.difficulty }}</span>
            }
            @if (lab.estimatedMinutes) {
              <span>{{ lab.estimatedMinutes }} min</span>
            }
          </span>
          <span class="lab-gallery__tags">
            @for (tag of lab.tags; track $index) {
              <span class="lab-gallery__tag">{{ tag }}</span>
            }
          </span>
          <span class="lab-gallery__action">{{
            selectedId() === lab._id ? 'Selected' : 'Select lab'
          }}</span>
        </button>
      }
    </div>
  `,
  styles: [
    `
      .lab-gallery {
        display: grid;
        grid-template-columns: repeat(
          auto-fit,
          minmax(min(100%, 270px), 1fr)
        );
        gap: 16px;
      }
      .lab-gallery__card {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 20px;
        text-align: left;
        font: inherit;
        color: var(--mat-sys-on-surface);
        background: var(--mat-sys-surface-container);
        border: 2px solid var(--mat-sys-outline-variant);
        border-radius: 16px;
        cursor: pointer;
        overflow-wrap: anywhere;
      }
      .lab-gallery__card:hover:not(:disabled),
      .lab-gallery__card--selected {
        border-color: var(--mat-sys-primary);
      }
      .lab-gallery__card--selected {
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
      }
      .lab-gallery__card:focus-visible {
        outline: 3px solid var(--mat-sys-primary);
        outline-offset: 3px;
      }
      .lab-gallery__card:disabled {
        cursor: default;
        opacity: 0.65;
      }
      .lab-gallery__top,
      .lab-gallery__meta,
      .lab-gallery__tags {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .lab-gallery__top {
        justify-content: space-between;
      }
      .lab-gallery__title {
        font-size: 1.1rem;
        font-weight: 600;
      }
      .lab-gallery__summary {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .lab-gallery__meta,
      .lab-gallery__status,
      .lab-gallery__tag {
        font-size: 0.85rem;
      }
      .lab-gallery__tag {
        padding: 4px 8px;
        border-radius: 8px;
        background: var(--mat-sys-surface-container-high);
        color: var(--mat-sys-on-surface);
      }
      .lab-gallery__action {
        margin-top: auto;
        font-weight: 600;
      }
    `,
  ],
})
export class CodingLabGalleryComponent {
  readonly labs = input.required<HandsOnLabMongo[]>();
  readonly selectedId = input('');
  readonly disabled = input(false);
  readonly selected = output<HandsOnLabMongo>();
}
