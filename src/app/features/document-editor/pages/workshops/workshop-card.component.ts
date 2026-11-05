import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
  host: { class: 'ngx-design-system ngx-document-design' },
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
                  style="--devicon-size: 40px"
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
        <p class="workshop-card__level">Level {{ level() }}</p><span class="workshop-card__status">Published</span>
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
  styles: [`
    :host { display: block; min-width: 0; }
    .workshop-card { position: relative; height: 112px; min-width: 0; border-bottom: 1px solid var(--ngx-color-border); background: var(--ngx-color-surface); }
    .workshop-card__link { display: block; box-sizing: border-box; height: 100%; padding: 10px 96px 10px 10px; overflow: auto; color: var(--ngx-color-text); text-decoration: none; }
    .workshop-card__artwork { position: relative; float: left; width: 48px; height: 48px; margin: 0 12px 8px 0; }
    .workshop-card__icon { display: grid; place-items: center; height: 100%; }
    .workshop-card__image { object-fit: contain; }
    .workshop-card__title { font-family: var(--ngx-font-heading); font-size: 0.85rem; margin: 0 0 4px; overflow-wrap: anywhere; }
    .workshop-card__level { font-size: 0.65rem; margin: 0 0 6px; color: var(--ngx-color-primary); }
    .workshop-card__status { float: right; font-size: 0.65rem; color: var(--ngx-color-muted); margin-left: 8px; }
    .workshop-card__summary { font-size: 0.75rem; color: var(--ngx-color-muted); margin: 0; overflow-wrap: anywhere; }
    .workshop-card__actions { position: absolute; top: 8px; right: 4px; display: flex; background: var(--ngx-color-surface); opacity: 0; pointer-events: none; }
    .workshop-card:is(:hover, :focus-within) .workshop-card__actions { opacity: 1; pointer-events: auto; }
    .workshop-card__link:focus-visible { outline: 2px solid var(--ngx-color-primary); outline-offset: -2px; }
    @media (hover: none) { .workshop-card__actions { opacity: 1; pointer-events: auto; } }
    @media (max-width: 600px) { .workshop-card { height: 140px; } .workshop-card__link { padding-right: 10px; padding-bottom: 48px; } .workshop-card__actions { top: auto; bottom: 4px; } }

  `],

})
export class WorkshopCardComponent {
  readonly workshop = input.required<WorkshopDto>();
  readonly level = computed(() => this.workshop().level ?? 1);
  readonly visible = input(true);
  readonly order = input(0);
  readonly deleteWorkshop = output<WorkshopDto>();
}
