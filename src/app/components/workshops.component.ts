import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './header.component';

@Component({
  selector: 'ngx-workshops',
  imports: [RouterModule, HeaderComponent],
  template: `
    <ngx-menu-management-header></ngx-menu-management-header>
    <router-outlet> </router-outlet>
  `,
})
export class WorkshopsComponent {}
