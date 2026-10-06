import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SectionDto } from '@tmdjr/document-contracts';
import {
  IsDeviconPipe,
  MenuDeviconComponent,
} from '../../devicon.component';

@Component({
  selector: 'ngx-section-card',
  imports: [
    RouterLink,
    MatIconModule,
    MatButtonModule,
    IsDeviconPipe,
    MenuDeviconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="section-card">
      <a
        class="section-card__link"
        [routerLink]="[section()._id, 'workshop-list']"
      >
        @if (section().headerSvgPath) { @if (section().headerSvgPath |
        isDevicon) {
        <ngx-menu-devicon
          class="section-card__image"
          [icon]="section().headerSvgPath"
          [large]="true"
          aria-hidden="true"
          style="--devicon-size: 64px"
        />
        } @else {
        <img
          class="section-card__image"
          [src]="section().headerSvgPath"
          alt=""
          aria-hidden="true"
        />
        } } @else {
        <mat-icon aria-hidden="true" class="section-card__placeholder"
          >image</mat-icon
        >
        }
        <h2 class="section-card__title">
          {{ section().sectionTitle }}
        </h2>
        <p class="section-card__description">
          {{ section().sectionDescription }}
        </p>
      </a>
      <div class="section-card__actions">
        <a
          matIconButton
          [routerLink]="['edit-section', section()._id]"
          [attr.aria-label]="'Edit ' + section().sectionTitle"
          [title]="'Edit ' + section().sectionTitle"
        >
          <mat-icon>edit</mat-icon>
        </a>
        <button
          matIconButton
          type="button"
          [attr.aria-label]="'Delete ' + section().sectionTitle"
          [title]="'Delete ' + section().sectionTitle"
          (click)="deleteSection.emit(section())"
        >
          <mat-icon>delete</mat-icon>
        </button>
      </div>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 350px;
        width: 100%;
      }
      .section-card {
        position: relative;
      }
      .section-card__link {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-decoration: none;
        border-radius: 24px;
        transition: box-shadow 0.4s;
        box-shadow: var(--mat-sys-level3);
        color: var(--mat-sys-on-primary-container);
        background: var(--mat-sys-secondary-container);
        &:hover {
          box-shadow: var(--mat-sys-level5);
        }
      }
      .section-card__image {
        width: 160px;
        height: 160px;
        object-fit: contain;
        padding: 20px;
      }
      .section-card__placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 200px;
        font-size: 4rem;
        color: var(--mat-sys-primary-fixed);
        background: var(--mat-sys-primary-fixed-dim);
        border-radius: 24px 24px 0 0;
      }
      .section-card__title {
        font-size: 2rem;
        font-weight: 400;
        margin: 0 0 8px;
      }
      .section-card__description {
        padding: 0 19px;
        font-size: 1.2rem;
        font-weight: 300;
        line-height: 1.75rem;
        margin: 0 0 24px;
      }
      .section-card__actions {
        position: absolute;
        top: 8px;
        right: 8px;
        display: flex;
        border-radius: var(--mat-sys-corner-full);
        color: var(--mat-sys-primary);
        background: var(--mat-sys-surface-container);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.15s;
      }
      .section-card:is(:hover, :focus-within) .section-card__actions {
        opacity: 1;
        pointer-events: auto;
      }
      @media (hover: none) {
        .section-card__actions {
          opacity: 1;
          pointer-events: auto;
        }
      }
    `,
  ],
})
export class SectionCardComponent {
  readonly section = input.required<SectionDto>();
  readonly deleteSection = output<SectionDto>();
}
