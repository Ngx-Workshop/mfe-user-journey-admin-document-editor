import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Observable } from 'rxjs';
import { Workshop } from '../navigation.interface';
import { NavigationService } from '../services/navigation.service';

type DocumentResolver = ResolveFn<
  Observable<Partial<Workshop> | undefined>
>;
export const documentResolver: DocumentResolver = (route) => {
  return inject(NavigationService).navigateToDocument(
    route.params['documentId']
  );
};
