import { ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { NavigationService } from '../../state/navigation.service';
import {
  IsDeviconPipe,
  MenuDeviconComponent,
} from '../../components/devicon.component';

@Component({
  host: { class: 'ngx-design-system ngx-document-design' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ngx-workshops',
  imports: [
    RouterModule,
    AsyncPipe,
    IsDeviconPipe,
    MenuDeviconComponent,
  ],
  template: `
    @if (viewModel$ | async; as vm) {
      <header class="workshops__context">
        @if (vm.headerSvgPath) {
          @if (vm.headerSvgPath | isDevicon) {
            <ngx-menu-devicon
              class="workshops__icon"
              [icon]="vm.headerSvgPath"
              [large]="true"
              aria-hidden="true"
            />
          } @else {
            <img
              class="workshops__image"
              [src]="vm.headerSvgPath"
              alt=""
            />
          }
        }
        <h1 class="workshops__title">
          {{ vm.sectionTitle }}:
          {{ vm.currentWorkshopTitle ?? 'Workshops' }}
        </h1>
      </header>
    }
    <router-outlet />
  `,
  styles: [`
    :host { display: block; min-width: 0; color: var(--ngx-color-text); }
    .workshops__context { display: flex; align-items: center; gap: 8px; padding: 6px 16px; border-bottom: 1px solid var(--ngx-color-border); background: var(--ngx-color-surface); }
    .workshops__title { font-family: var(--ngx-font-heading); font-size: 0.75rem; margin: 0; overflow-wrap: anywhere; }
    .workshops__image { width: 24px; height: 24px; object-fit: contain; }
    .workshops__icon { --devicon-size: 24px; }

  `],

})
export class WorkshopsComponent {
  navigationService = inject(NavigationService);

  viewModel$ = combineLatest([
    this.navigationService
      .getCurrentWorkshop()
      .pipe(map((workshop) => workshop?.name)),
    this.navigationService.getCurrentSection(),
  ]).pipe(
    map(
      ([
        currentWorkshopTitle,
        { headerSvgPath, sectionTitle } = {},
      ]) => ({
        headerSvgPath,
        sectionTitle,
        currentWorkshopTitle,
      })
    )
  );
}
