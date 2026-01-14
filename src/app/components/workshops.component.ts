import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { NavigationService } from '../services/navigation.service';
import {
  HeaderComponent,
  SidenavHeaderData,
} from './header.component';

@Component({
  selector: 'ngx-workshops',
  imports: [RouterModule, HeaderComponent, AsyncPipe],
  template: `
    @if(viewModel$ | async; as vm) {
    <ngx-menu-management-header
      [sidenavHeaderData]="vm.sidenavHeaderData"
    />
    }
    <router-outlet />
  `,
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
        sidenavHeaderData: {
          headerSvgPath,
          sectionTitle,
          currentWorkshopTitle,
        } as SidenavHeaderData,
      })
    )
  );
}
