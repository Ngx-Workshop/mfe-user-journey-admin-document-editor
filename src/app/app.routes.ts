import { Route } from '@angular/router';
import { userAuthenticatedGuard } from '@tmdjr/ngx-user-metadata';
import App from './app';

export const Routes: Route[] = [
  {
    path: '',
    canActivate: [userAuthenticatedGuard],
    children: [
      { path: '', redirectTo: 'document', pathMatch: 'full' },
      {
        path: 'document',
        component: App,
        loadChildren: () =>
          import('./components/workshops.routing').then(
            (m) => m.WORKSHOPS_ROUTES
          ),
      },
    ],
  },
];
