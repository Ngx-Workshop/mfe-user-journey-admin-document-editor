import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { WorkshopPageDto } from '@tmdjr/document-contracts';
import { Observable } from 'rxjs';
import { NavigationService } from '../services/navigation.service';

type DocumentResolver = ResolveFn<Observable<WorkshopPageDto>>;
export const documentResolver: DocumentResolver = (route) => {
  return inject(NavigationService).navigateToDocument(
    route.params['documentId']
  );
};
