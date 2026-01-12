import { Route } from '@angular/router';
import { documentResolver } from '../../resolvers/document.resolver';

export const WORKSHOPS_DETAIL_ROUTES: Route[] = [
  {
    path: '',
    data: { alwaysRefresh: true },
    resolve: { documentResolver },
    loadComponent: () =>
      import('./workshop-detail.component').then(
        (m) => m.WorkshopDetailComponent
      ),
  },
  {
    path: ':documentId',
    data: { alwaysRefresh: true },
    resolve: { documentResolver },
    loadComponent: () =>
      import('./workshop-detail.component').then(
        (m) => m.WorkshopDetailComponent
      ),
  },
  { path: '**', redirectTo: '/404' },
];
