import { inject } from '@angular/core';
import { Route } from '@angular/router';
import { userAuthenticatedGuard } from '@tmdjr/ngx-user-metadata';

import { documentResolver } from './resolvers/document.resolver';
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
          import('./components/workshops-pages/sections/section-list.component').then(
            (m) => m.SectionListComponent
          ),
      },
      {
        path: 'create-section',
        canDeactivate: [(component: { saving: () => boolean }) => !component.saving()],
        loadComponent: () =>
          import('./components/workshops-pages/sections/create-section.component').then(
            (m) => m.CreateSectionComponent
          ),
      },
      {
        path: 'edit-section/:sectionId',
        canDeactivate: [(component: { saving: () => boolean }) => !component.saving()],
        loadComponent: () =>
          import('./components/workshops-pages/sections/create-section.component').then(
            (m) => m.CreateSectionComponent
          ),
      },
      {
        path: ':section/create-workshop',
        canDeactivate: [(component: { saving: () => boolean }) => !component.saving()],
        loadComponent: () =>
          import('./components/workshops-pages/workshops/create-workshop.component').then(
            (m) => m.CreateWorkshopComponent
          ),
      },
      {
        path: ':section/edit-workshop/:workshopId',
        canDeactivate: [(component: { saving: () => boolean }) => !component.saving()],
        loadComponent: () =>
          import('./components/workshops-pages/workshops/create-workshop.component').then(
            (m) => m.CreateWorkshopComponent
          ),
      },
      {
        path: ':section',
        resolve: { sectionResolver },
        loadComponent: () =>
          import('./components/workshops.component').then((m) => m.WorkshopsComponent),
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
              import('./components/workshops-pages/workshops/workshop-list.component').then(
                (m) => m.WorkshopListComponent
              ),
          },
          {
            path: ':workshopId',
            resolve: { workshopResolver },
            children: [
              {
                path: 'create-page',
                canDeactivate: [(component: { saving: () => boolean }) => !component.saving()],
                loadComponent: () =>
                  import('./components/workshops-pages/documents/create-page.component').then(
                    (m) => m.CreatePageComponent
                  ),
              },
              {
                path: 'edit-page/:documentId',
                canDeactivate: [(component: { saving: () => boolean }) => !component.saving()],
                loadComponent: () =>
                  import('./components/workshops-pages/documents/create-page.component').then(
                    (m) => m.CreatePageComponent
                  ),
              },
              {
                path: '',
                data: { alwaysRefresh: true },
                resolve: { documentResolver },
                loadComponent: () =>
                  import('./components/workshops-pages/documents/workshop-detail.component').then(
                    (m) => m.WorkshopDetailComponent
                  ),
              },
              {
                path: ':documentId',
                data: { alwaysRefresh: true },
                resolve: { documentResolver },
                loadComponent: () =>
                  import('./components/workshops-pages/documents/workshop-detail.component').then(
                    (m) => m.WorkshopDetailComponent
                  ),
              },
              { path: '**', redirectTo: '/404' },
            ],
          },
        ],
      },
    ],
  },
];
