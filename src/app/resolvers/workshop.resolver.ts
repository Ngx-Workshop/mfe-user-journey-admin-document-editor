import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { WorkshopDto } from '@tmdjr/document-contracts';
import { Observable } from 'rxjs';
import { NavigationService } from '../services/navigation.service';

type WorkshopResolver = ResolveFn<
  Observable<Partial<WorkshopDto> | undefined>
>;
export const workshopResolver: WorkshopResolver = (route) => {
  const param = route.routeConfig?.path ?? ':';
  const workshopId =
    route.params[param.substring(1)] ?? route.routeConfig?.path;

  return inject(NavigationService).navigateToWorkshop(
    workshopId ?? ''
  );
};
