import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgxParticleHeader } from '@tmdjr/ngx-shared-headers';
import { combineLatest, map } from 'rxjs';
import { NavigationService } from '../services/navigation.service';
import { IsDeviconPipe, MenuDeviconComponent } from './devicon.component';

@Component({
  selector: 'ngx-workshops',
  imports: [RouterModule, AsyncPipe, NgxParticleHeader, IsDeviconPipe, MenuDeviconComponent],
  template: `
    @if (viewModel$ | async; as vm) {
      <ngx-particle-header>
        @if (vm.headerSvgPath) {
          @if (vm.headerSvgPath | isDevicon) {
            <ngx-menu-devicon
              class="workshops__icon"
              [icon]="vm.headerSvgPath"
              [large]="true"
              aria-hidden="true"
            />
          } @else {
            <img class="workshops__image" [src]="vm.headerSvgPath" alt="" />
          }
        }
        <h1 class="workshops__title">
          {{ vm.sectionTitle }}:
          {{ vm.currentWorkshopTitle ?? 'Workshops' }}
        </h1>
      </ngx-particle-header>
    }
    <router-outlet />
  `,
  styles: [
    `
      .workshops__title {
        font-size: 1.85rem;
        font-weight: 100;
        margin: 1.7rem 0;
        padding: 0 1rem;
      }
      .workshops__image {
        width: 64px;
        z-index: 2;
        margin-left: 1.5rem;
      }
      .workshops__icon {
        --devicon-size: 64px;
        z-index: 2;
        margin-left: 1.5rem;
      }
      @media (max-width: 959px) {
        .workshops__image {
          width: 35px;
          margin: 0;
        }
        .workshops__icon {
          --devicon-size: 35px;
          margin: 0;
        }
      }
    `,
  ],
})
export class WorkshopsComponent {
  navigationService = inject(NavigationService);

  viewModel$ = combineLatest([
    this.navigationService.getCurrentWorkshop().pipe(map((workshop) => workshop?.name)),
    this.navigationService.getCurrentSection(),
  ]).pipe(
    map(([currentWorkshopTitle, { headerSvgPath, sectionTitle } = {}]) => ({
      headerSvgPath,
      sectionTitle,
      currentWorkshopTitle,
    }))
  );
}
