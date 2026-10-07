import { inject, Injectable } from '@angular/core';
import {
  SectionDto,
  SectionsMapDto,
  WorkshopDto,
} from '@tmdjr/document-contracts';
import {
  throwError,
  take,
  BehaviorSubject,
  defer,
  Observable,
  of,
} from 'rxjs';
import { map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { ResolvedWorkshopEntry } from '../models/workshop-journey';
import { DocumentApiService } from '../api/document-api.service';

const staticPages: Map<string, Partial<WorkshopDto>> = new Map([
  ['Angular', { name: 'Angular' }],
  ['NestJS', { name: 'NestJS' }],
  ['RxJS', { name: 'RxJS' }],
]);

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
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

  private readonly sectionWorkshopsCache = new Map<
    string,
    {
      expiresAt: number;
      stream: Observable<WorkshopDto[]>;
    }
  >();
  private selectionRevision = 0;
  private readonly cacheTTL = 5 * 60 * 1000;
  private readonly api = inject(DocumentApiService);

  fetchSections() {
    return this.api.fetchSections().pipe(
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
    this.sectionWorkshopsCache.delete(workshop.sectionId);
    if (this.currentSection$.value?._id === workshop.sectionId) {
      this.selectionRevision++;
      const workshops = this.workshops$.value;
      const exists = workshops.some(
        (item) => item._id === workshop._id
      );
      this.workshops$.next(
        exists
          ? workshops.map((item) =>
              item._id === workshop._id ? workshop : item
            )
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
    this.sectionWorkshopsCache.delete(id);
    if (this.currentSection$.value?._id === id) {
      this.currentSection$.next(undefined);
      this.workshops$.next([]);
      this.currentWorkshop$.next(undefined);
    } else if (this.currentWorkshop$.value?.sectionId === id) {
      this.currentWorkshop$.next(undefined);
    }
  }

  navigateToSection(sectionId: string, force = false) {
    return defer(() => {
      const revision = ++this.selectionRevision;
      if (this.currentSection$.value?._id !== sectionId) {
        this.currentWorkshop$.next(undefined);
        this.workshops$.next([]);
      }
      this.currentSection$.next(
        this.sections$.value.sections[sectionId]
      );
      return this.fetchSectionWorkshops(sectionId, force).pipe(
        tap((workshops) => {
          if (revision === this.selectionRevision)
            this.publishWorkshops(sectionId, workshops);
        })
      );
    });
  }

  /** Refresh data without changing the user's current route selection. */
  refreshSection(sectionId: string) {
    return defer(() => {
      const revision = this.selectionRevision;
      return this.fetchSectionWorkshops(sectionId, true).pipe(
        tap((workshops) => {
          if (revision === this.selectionRevision)
            this.publishWorkshops(sectionId, workshops);
        })
      );
    });
  }

  private publishWorkshops(
    sectionId: string,
    workshops: WorkshopDto[]
  ): void {
    if (this.currentSection$.value?._id !== sectionId) return;
    this.workshops$.next(workshops);
    const selected = this.currentWorkshop$.value;
    if (selected?.sectionId === sectionId) {
      this.currentWorkshop$.next(
        workshops.find((item) => item._id === selected._id)
      );
    }
  }

  removeWorkshop(id: string, sectionId: string): void {
    this.sectionWorkshopsCache.delete(sectionId);
    if (this.currentSection$.value?._id === sectionId) {
      this.selectionRevision++;
      this.workshops$.next(
        this.workshops$.value.filter((item) => item._id !== id)
      );
    }
    if (this.currentWorkshop$.value?._id === id)
      this.currentWorkshop$.next(undefined);
  }

  removePage(workshop: Partial<WorkshopDto>, pageId: string): void {
    if (!workshop._id || !workshop.sectionId) return;
    const current = this.workshops$.value.find(
      (item) => item._id === workshop._id
    );
    if (current)
      this.addWorkshop({
        ...current,
        workshopDocuments: current.workshopDocuments.filter(
          (page) => page._id !== pageId
        ),
      });
    else this.sectionWorkshopsCache.delete(workshop.sectionId);
  }

  private fetchSectionWorkshops(sectionId: string, force = false) {
    return defer(() => {
      const cached = this.sectionWorkshopsCache.get(sectionId);
      if (!force && cached && cached.expiresAt > Date.now())
        return cached.stream;
      const entry = {
        expiresAt: Number.POSITIVE_INFINITY,
        stream: this.api.fetchSectionWorkshops(sectionId).pipe(
          tap({
            next: () =>
              (entry.expiresAt = Date.now() + this.cacheTTL),
            error: () => {
              if (
                this.sectionWorkshopsCache.get(sectionId) === entry
              ) {
                this.sectionWorkshopsCache.delete(sectionId);
              }
            },
          }),
          shareReplay({ bufferSize: 1, refCount: false })
        ),
      };
      this.sectionWorkshopsCache.set(sectionId, entry);
      return entry.stream;
    });
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
    return this.getCurrentWorkshop().pipe(
      take(1),
      switchMap((workshop): Observable<ResolvedWorkshopEntry> => {
        const entry = workshop?.workshopDocuments?.find(
          (item) => item._id === workshopDocumentId
        );
        if (!entry)
          return throwError(
            () =>
              new Error(
                'This page no longer exists in this workshop.'
              )
          );
        if (entry.kind !== 'PAGE')
          return of({ kind: entry.kind, entry });
        return this.api
          .getDocument(entry._id)
          .pipe(
            map((document) => ({ kind: 'PAGE' as const, document }))
          );
      })
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
