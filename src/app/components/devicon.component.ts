import { Component, input, Pipe, PipeTransform } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Pipe({ name: 'isDevicon', standalone: true, pure: true })
export class IsDeviconPipe implements PipeTransform {
  transform(value: string | null | undefined): boolean {
    return /^devicon-[a-z0-9-]+(?:\s+[\w-]+)*$/.test(
      value?.trim() ?? ''
    );
  }
}

@Component({
  selector: 'ngx-menu-devicon',
  imports: [IsDeviconPipe, MatIcon],
  template: `
    @if (icon() | isDevicon) {
    <i
      class="devicon"
      [class]="icon()?.trim()"
      [class.devicon--large]="large()"
      aria-hidden="true"
    ></i>
    } @else {
    <mat-icon class="devicon" [class.devicon--large]="large()">{{
      icon()
    }}</mat-icon>
    }
  `,
  styles: [
    `
      :host {
        .devicon {
          font-size: 1.6rem;
          inline-size: 30px;
          block-size: 30px;
          vertical-align: middle;

          &.devicon--large {
            font-size: var(--devicon-size, 2.125rem);
            inline-size: var(--devicon-size, 2.1875rem);
            block-size: var(--devicon-size, 2.1875rem);
          }
        }
      }
    `,
  ],
})
export class MenuDeviconComponent {
  readonly icon = input<string | null | undefined>();
  readonly large = input(false);
}
