import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { WorkshopDto } from '@tmdjr/document-contracts';
import {
  IsDeviconPipe,
  MenuDeviconComponent,
} from '../../components/devicon.component';
import { OptimizeCloudinaryUrlPipe } from './optimize-cloudinary-url.pipe';

@Component({
  selector: 'ngx-workshop-card',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    NgOptimizedImage,
    OptimizeCloudinaryUrlPipe,
    IsDeviconPipe,
    MenuDeviconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="workshop-card"
      [class.workshop-card--visible]="visible()"
      [style.--animation-order]="order()"
    >
      <a
        class="workshop-card__link"
        [routerLink]="[
          '../',
          workshop().workshopDocumentGroupId,
          workshop().workshopDocuments[0]?._id || '',
        ]"
      >
        <div class="workshop-card__artwork">
          @if (workshop().thumbnail) {
            @if (workshop().thumbnail | isDevicon) {
              <div class="workshop-card__icon">
                <ngx-menu-devicon
                  [icon]="workshop().thumbnail"
                  [large]="true"
                  aria-hidden="true"
                  style="--devicon-size: 96px"
                />
              </div>
            } @else {
              <img
                class="workshop-card__image"
                [ngSrc]="workshop().thumbnail | optimizeCloudinaryUrl"
                [alt]="workshop().name"
                priority
                fill
              />
            }
          } @else {
            <mat-icon aria-hidden="true">image</mat-icon>
          }
        </div>
        <h2 class="workshop-card__title">{{ workshop().name }}</h2>
        <p class="workshop-card__summary">{{ workshop().summary }}</p>
      </a>
      <div class="workshop-card__actions">
        <a
          matIconButton
          class="workshop-card__edit"
          [routerLink]="['../edit-workshop', workshop()._id]"
          [attr.aria-label]="'Edit ' + workshop().name"
          [title]="'Edit ' + workshop().name"
          ><mat-icon>edit</mat-icon></a
        >
        <button
          matIconButton
          class="workshop-card__delete"
          type="button"
          [attr.aria-label]="'Delete ' + workshop().name"
          [title]="'Delete ' + workshop().name"
          (click)="deleteWorkshop.emit(workshop())"
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
        max-width: 100%;
      }
      .workshop-card {
        position: relative;
        width: 325px;
        max-width: 100%;
        height: 375px;
        overflow: hidden;
        border-radius: 16px;
        color: var(--mat-sys-on-secondary-container);
        background: var(--mat-sys-secondary-container);
        box-shadow: var(--mat-sys-level3);
        opacity: 0;
      }
      .workshop-card--visible {
        animation: circleReveal 0.6s ease-in-out forwards;
        animation-delay: calc(var(--animation-order, 0) * 150ms);
      }
      .workshop-card__link {
        display: block;
        height: 100%;
        overflow: auto;
        color: inherit;
        text-decoration: none;
      }
      .workshop-card__actions {
        position: absolute;
        top: 8px;
        right: 8px;
        display: flex;
        border-radius: var(--mat-sys-corner-full);
        background: var(--mat-sys-secondary-container);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.15s;
      }
      .workshop-card:is(:hover, :focus-within)
        .workshop-card__actions {
        opacity: 1;
        pointer-events: auto;
      }
      .workshop-card__artwork {
        position: relative;
        width: 100%;
        height: 50%;
      }
      .workshop-card__icon {
        height: 100%;
        display: grid;
        place-items: center;
      }
      .workshop-card__image {
        object-fit: contain;
      }
      .workshop-card__title {
        font-weight: 100;
        font-stretch: condensed;
        font-size: 1.6rem;
        padding: 12px 8px;
        margin: 0;
      }
      .workshop-card__summary {
        font-size: 1rem;
        font-weight: 100;
        padding: 0 8px;
        margin: 0 0 24px;
      }
      @keyframes circleReveal {
        from {
          opacity: 0;
          clip-path: circle(0% at 85% 85%);
        }
        to {
          opacity: 1;
          clip-path: circle(200% at 0% 0%);
        }
      }
      @media (hover: none) {
        .workshop-card__actions {
          opacity: 1;
          pointer-events: auto;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .workshop-card--visible {
          animation: none;
          opacity: 1;
        }
      }
    `,
  ],
})
export class WorkshopCardComponent {
  readonly workshop = input.required<WorkshopDto>();
  readonly visible = input(true);
  readonly order = input(0);
  readonly deleteWorkshop = output<WorkshopDto>();
}
