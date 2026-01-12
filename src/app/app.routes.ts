import { inject } from '@angular/core';
import { Route } from '@angular/router';
import { userAuthenticatedGuard } from '@tmdjr/ngx-user-metadata';

import { sectionResolver } from './resolvers/section.resolver';
import { workshopResolver } from './resolvers/workshop.resolver';
import { NavigationService } from './services/navigation.service';

export const Routes: Route[] = [
  {
    path: '',
    canActivate: [userAuthenticatedGuard],
    resolve: {
      sections: () => inject(NavigationService).fetchSections(),
    },
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import(
            './components/workshops-pages/section-list.component'
          ).then((m) => m.SectionListComponent),
      },
      {
        path: ':section',
        resolve: { sectionResolver },
        loadComponent: () =>
          import('./components/workshops.component').then(
            (m) => m.WorkshopsComponent
          ),
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
              import(
                './components/workshops-pages/workshop-list.component'
              ).then((m) => m.WorkshopListComponent),
          },
          {
            path: ':workshopId',
            resolve: { workshopResolver },
            loadChildren: () =>
              import(
                './components/workshops-pages/workshop-detail.routing'
              ).then((m) => m.WORKSHOPS_DETAIL_ROUTES),
          },
        ],
      },
    ],
  },
];
