import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  MonoTypeOperatorFunction,
  Observable,
  of,
  timer,
} from 'rxjs';
import {
  map,
  shareReplay,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';
import {
  Section,
  Sections,
  Workshop,
  WorkshopDocument,
} from '../navigation.interface';

const staticPages: Map<string, Partial<Workshop>> = new Map([
  ['Angular', { name: 'Angular' }],
  ['NestJS', { name: 'NestJS' }],
  ['RxJS', { name: 'RxJS' }],
]);

function shareReplayWithTTL<T>(
  bufferSize: number,
  ttl: number
): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) => {
    const stop$ = timer(ttl);
    const shared$ = source.pipe(
      takeUntil(stop$),
      shareReplay(bufferSize)
    );
    return shared$;
  };
}

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private sections$ = new BehaviorSubject<Sections>({
    sections: {},
  });
  private currentSection$ = new BehaviorSubject<
    Partial<Section> | undefined
  >(undefined);
  private workshops$ = new BehaviorSubject<Workshop[]>([]);
  private currentWorkshop$ = new BehaviorSubject<
    Partial<Workshop> | undefined
  >(undefined);
  private workshopDocument$ = new BehaviorSubject<
    WorkshopDocument | undefined
  >(undefined);

  private sectionWorkshopsCache: {
    [sectionId: string]: Observable<Workshop[]>;
  } = {};
  private workshopDocumentCache: {
    [workshopDocumentId: string]: Observable<WorkshopDocument>;
  } = {};
  private cacheTTL = 5 * 60 * 1000;

  private http: HttpClient = inject(HttpClient);

  fetchSections() {
    return this.http
      .get<Sections>('/api/documents/navigation/sections')
      .pipe(
        tap((sections) => {
          this.sections$.next(sections);
        })
      );
  }

  navigateToSection(sectionId: string, force = false) {
    return of(sectionId).pipe(
      tap((id) => {
        this.currentSection$.next(
          this.sections$.getValue().sections[id]
        );
      }),
      switchMap((id) => this.fetchSectionWorkshops(id, force)),
      tap((workshops) => this.workshops$.next(workshops))
    );
  }

  private fetchSectionWorkshops(sectionId: string, force = false) {
    if (force || !this.sectionWorkshopsCache[sectionId]) {
      this.sectionWorkshopsCache[sectionId] = this.http
        .get<Workshop[]>('/api/documents/navigation/workshops', {
          params: { section: sectionId },
        })
        .pipe(shareReplayWithTTL(1, this.cacheTTL));
    }
    return this.sectionWorkshopsCache[sectionId];
  }

  navigateToWorkshop(workshopDocumentId: string) {
    return of(workshopDocumentId).pipe(
      tap((id) => {
        this.currentWorkshop$.next(
          staticPages.get(id) ??
            this.workshops$
              .getValue()
              .find(
                (workshop) => workshop.workshopDocumentGroupId === id
              )
        );
      }),
      map(() => this.currentWorkshop$.getValue())
    );
  }

  navigateToDocument(workshopDocumentId: string) {
    return this.http.get<WorkshopDocument>(
      `/api/documents/workshop/${workshopDocumentId}`
    );
  }

  getSections() {
    return this.sections$.asObservable();
  }

  getCurrentSection() {
    return this.currentSection$.asObservable();
  }

  getWorkshops() {
    return this.workshops$.asObservable();
  }

  getCurrentWorkshop() {
    return this.currentWorkshop$.asObservable();
  }

  getWorkshopDocument() {
    return this.workshopDocument$.asObservable();
  }
}
