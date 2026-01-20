import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { WorkshopDto } from '@tmdjr/document-contracts';
import { Observable } from 'rxjs';
import { NavigationService } from '../services/navigation.service';

type SectionResolver = ResolveFn<Observable<WorkshopDto[]>>;
export const sectionResolver: SectionResolver = (route) => {
  const param = route.routeConfig?.path ?? ':';
  const sectionId =
    route.params[param.substring(1)] ?? route.routeConfig?.path;

  return inject(NavigationService).navigateToSection(sectionId);
};
