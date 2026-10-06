import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { NavigationService } from '../services/navigation.service';
import { ResolvedWorkshopEntry } from '../models/workshop-journey';

export const documentResolver: ResolveFn<ResolvedWorkshopEntry> = (route) =>
  inject(NavigationService).navigateToDocument(route.params['documentId']);
