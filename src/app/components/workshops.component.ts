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
        class="section-header-icon"
        [icon]="vm.headerSvgPath"
        [large]="true"
        aria-hidden="true"
      />
      } @else {
      <img [src]="vm.headerSvgPath" alt="" />
      } }
      <h1>
        {{ vm.sectionTitle }}:
        {{ vm.currentWorkshopTitle ?? 'Workshops' }}
      </h1>
    </ngx-particle-header>
    }
    <router-outlet />
  `,
  styles: [
    `
      :host {
        h1 {
          font-size: 1.85rem;
          font-weight: 100;
          margin: 1.7rem 0;
          padding: 0 1rem;
        }
        img {
          width: 64px;
          z-index: 2;
          margin-left: 1.5rem;
          @media (max-width: 959px) {
            width: 35px;
            margin: 0;
          }
          .section-header-icon {
            --devicon-size: 64px;
            z-index: 2;
            margin-left: 1.5rem;
            @media (max-width: 959px) {
              --devicon-size: 35px;
              margin: 0;
            }
          }
        }
      }
    `,
  ],
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
