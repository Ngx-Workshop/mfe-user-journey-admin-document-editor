import { Route } from '@angular/router';
import { sectionResolver } from '../resolvers/section.resolver';
import { workshopResolver } from '../resolvers/workshop.resolver';
import { WorkshopsComponent } from './workshops.component';

export const WORKSHOPS_ROUTES: Route[] = [
  {
    path: ':section',
    resolve: { sectionResolver },
    component: WorkshopsComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'workshop-list',
      },
      {
        path: 'workshop-list',
        data: { alwaysRefresh: true },
        resolve: { workshopResolver },
        loadComponent: () =>
          import('./workshops-pages/workshop-list.component').then(
            (m) => m.WorkshopListComponent
          ),
      },
      {
        path: ':workshopId',
        resolve: { workshopResolver },
        loadChildren: () =>
          import('./workshops-pages/workshop-detail.routing').then(
            (m) => m.WORKSHOPS_DETAIL_ROUTES
          ),
      },
    ],
  },
];
