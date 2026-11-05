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
} from '../../components/devicon.component';

@Component({
  host: { class: 'ngx-design-system ngx-document-design' },
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
        @if (section().headerSvgPath) {
          @if (section().headerSvgPath | isDevicon) {
            <ngx-menu-devicon
              class="section-card__image"
              [icon]="section().headerSvgPath"
              [large]="true"
              aria-hidden="true"
              style="--devicon-size: 32px"
            />
          } @else {
            <img
              class="section-card__image"
              [src]="section().headerSvgPath"
              alt=""
              aria-hidden="true"
            />
          }
        } @else {
          <mat-icon
            aria-hidden="true"
            class="section-card__placeholder"
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
  styles: [`
    :host { display: block; min-width: 0; }
    .section-card { position: relative; border-bottom: 1px solid var(--ngx-color-border); background: var(--ngx-color-surface); }
    .section-card__link { display: grid; grid-template-columns: 40px minmax(0, 1fr); column-gap: 12px; padding: 10px 96px 10px 10px; color: var(--ngx-color-text); text-decoration: none; min-height: 72px; }
    .section-card__image, .section-card__placeholder { grid-column: 1; grid-row: 1 / 3; width: 32px; height: 32px; object-fit: contain; align-self: center; }
    .section-card__title { grid-column: 2; margin: 0 0 4px; font-family: var(--ngx-font-heading); font-size: 0.9rem; overflow-wrap: anywhere; }
    .section-card__description { grid-column: 2; margin: 0; font-size: 0.75rem; color: var(--ngx-color-muted); overflow-wrap: anywhere; }
    .section-card__actions { position: absolute; top: 8px; right: 4px; display: flex; opacity: 0; pointer-events: none; }
    .section-card:is(:hover, :focus-within) .section-card__actions { opacity: 1; pointer-events: auto; }
    .section-card__link:focus-visible { outline: 2px solid var(--ngx-color-primary); outline-offset: -2px; }
    @media (hover: none) { .section-card__actions { opacity: 1; pointer-events: auto; } }
    @media (max-width: 600px) { .section-card__link { padding-right: 10px; padding-bottom: 48px; } .section-card__actions { top: auto; bottom: 4px; } }

  `],

})
export class SectionCardComponent {
  readonly section = input.required<SectionDto>();
  readonly deleteSection = output<SectionDto>();
}
