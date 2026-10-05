import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  SectionDto,
  SectionsMapDto,
  WorkshopDto,
  WorkshopPageDto,
} from '@tmdjr/document-contracts';
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

const staticPages: Map<string, Partial<WorkshopDto>> = new Map([
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
  private readonly baseUrl = environment.documentsApiBaseUrl;
  private sections$ = new BehaviorSubject<SectionsMapDto>({
    sections: {},
  });
  private currentSection$ = new BehaviorSubject<
    SectionDto | undefined
  >(undefined);
  private workshops$ = new BehaviorSubject<WorkshopDto[]>([]);
  private currentWorkshop$ = new BehaviorSubject<
    Partial<WorkshopDto> | undefined
  >(undefined);

  private sectionWorkshopsCache: {
    [sectionId: string]: Observable<WorkshopDto[]>;
  } = {};

  private cacheTTL = 5 * 60 * 1000;

  private http: HttpClient = inject(HttpClient);

  fetchSections() {
    return this.http
      .get<SectionsMapDto>(`${this.baseUrl}/navigation/sections`)
      .pipe(
        tap((sections) => {
          this.sections$.next(sections);
        })
      );
  }

  getSections() {
    return this.sections$.pipe(
      map(({ sections }) => Object.values(sections))
    );
  }

  addWorkshop(workshop: WorkshopDto): void {
    delete this.sectionWorkshopsCache[workshop.sectionId];
    if (this.currentSection$.value?._id === workshop.sectionId) {
      const workshops = this.workshops$.value;
      const exists = workshops.some((item) => item._id === workshop._id);
      this.workshops$.next(
        exists
          ? workshops.map((item) => item._id === workshop._id ? workshop : item)
          : [...workshops, workshop]
      );
    }
    if (this.currentWorkshop$.value?._id === workshop._id) {
      this.currentWorkshop$.next(workshop);
    }
  }

  addSection(section: SectionDto): void {
    this.sections$.next({
      sections: {
        ...this.sections$.value.sections,
        [section._id]: section,
      },
    });
    if (this.currentSection$.value?._id === section._id) {
      this.currentSection$.next(section);
    }
  }

  removeSection(id: string): void {
    const sections = { ...this.sections$.value.sections };
    delete sections[id];
    this.sections$.next({ sections });
    delete this.sectionWorkshopsCache[id];
    if (this.currentSection$.value?._id === id) {
      this.currentSection$.next(undefined);
      this.workshops$.next([]);
      this.currentWorkshop$.next(undefined);
    } else if (this.currentWorkshop$.value?.sectionId === id) {
      this.currentWorkshop$.next(undefined);
    }
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
        .get<WorkshopDto[]>(`${this.baseUrl}/navigation/workshops`, {
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
    return this.http.get<WorkshopPageDto>(
      `${this.baseUrl}/workshop/${workshopDocumentId}`
    );
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
}
