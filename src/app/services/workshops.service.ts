import { inject, Injectable } from '@angular/core';
import {
  CreateSectionDto,
  CreateWorkshopPageDto,
  DeletePageParamsDto,
  EditPageNameUpdateWorkshopDto,
  SectionDto,
  UpdateSectionDto,
  UpdateWorkshopDto,
  AddWorkshopReferenceDto,
} from '@tmdjr/document-contracts';
import { catchError, map, of, switchMap, take, tap } from 'rxjs';
import { WorkshopJourneyItem } from '../models/workshop-journey';
import { DocumentApiService } from './document-api.service';
import { NavigationService } from './navigation.service';

export type { Result } from './document-api.service';

/** Singleton command/state boundary. HTTP services never own selection or editor state. */
@Injectable({ providedIn: 'root' })
export class WorkshopEditorService {
  private readonly api = inject(DocumentApiService);
  private readonly navigation = inject(NavigationService);

  getSection(id: string) {
    return this.api.getSection(id);
  }

  createSection(section: CreateSectionDto & Pick<SectionDto, 'menuSvgPath' | 'headerSvgPath'>) {
    return this.api.createSection(section).pipe(tap((value) => this.navigation.addSection(value)));
  }

  updateSection(id: string, section: UpdateSectionDto) {
    return this.api
      .updateSection(id, section)
      .pipe(tap((value) => this.navigation.addSection(value)));
  }

  deleteSection(id: string) {
    return this.api.deleteSection(id).pipe(
      tap((result) => {
        if (result?.acknowledged === true && result.deletedCount === 1) {
          this.navigation.removeSection(id);
        }
      })
    );
  }

  createWorkshop(workshop: UpdateWorkshopDto) {
    return this.api.createWorkshop(workshop).pipe(
      tap(({ success }) => {
        if (success) this.navigation.addWorkshop(success);
      })
    );
  }

  editWorkshopNameAndSummary(workshop: UpdateWorkshopDto) {
    return this.api.editWorkshopNameAndSummary(workshop).pipe(
      tap(({ success }) => {
        if (success) this.navigation.addWorkshop(success);
      })
    );
  }

  deleteWorkshop(id: string) {
    return this.navigation.getCurrentSection().pipe(
      take(1),
      switchMap((section) =>
        this.api.deleteWorkshop(id).pipe(
          tap(({ success }) => {
            if (success?.acknowledged !== true || success.deletedCount !== 1) {
              throw new Error('The server did not confirm workshop deletion.');
            }
            if (section) this.navigation.removeWorkshop(id, section._id);
          }),
          switchMap((result) =>
            section
              ? this.navigation.refreshSection(section._id).pipe(
                  map(() => result),
                  // Confirmed deletion has already been reconciled. Do not invite a duplicate mutation.
                  catchError(() => of(result))
                )
              : of(result)
          )
        )
      )
    );
  }

  sortWorkshops(workshops: UpdateWorkshopDto[]) {
    return this.api.sortWorkshops(workshops).pipe(
      tap(({ success }) => {
        if (!success) throw new Error('The server did not confirm workshop order.');
        success.forEach((workshop) => this.navigation.addWorkshop(workshop));
      })
    );
  }

  createPage(page: CreateWorkshopPageDto) {
    return this.api.createPage(page).pipe(
      tap(({ success }) => {
        if (!success) throw new Error('The server did not confirm page creation.');
        this.navigation.addWorkshop(success);
      })
    );
  }

  addReference(reference: AddWorkshopReferenceDto) {
    return this.api.addReference(reference).pipe(
      tap(({ success }) => {
        if (!success) throw new Error('The server did not confirm page creation.');
        this.navigation.addWorkshop(success);
      })
    );
  }

  deletePage(page: DeletePageParamsDto) {
    return this.navigation.getCurrentWorkshop().pipe(
      take(1),
      switchMap((workshop) =>
        this.api.deletePage(page).pipe(
          tap(({ success }) => {
            if (success?.acknowledged !== true || success.deletedCount !== 1) {
              throw new Error('The server did not confirm page deletion.');
            }
            if (workshop) this.navigation.removePage(workshop, page._id);
          })
        )
      )
    );
  }

  editPageName(page: EditPageNameUpdateWorkshopDto) {
    return this.api.editPageName(page).pipe(
      tap(({ success }) => {
        if (!success) throw new Error('The server did not confirm page update.');
        this.navigation.addWorkshop(success);
      })
    );
  }

  sortDocuments(pages: WorkshopJourneyItem[], workshopId: string) {
    return this.api.sortDocuments(pages, workshopId).pipe(
      tap(({ success }) => {
        if (!success) throw new Error('The server did not confirm page order.');
        this.navigation.addWorkshop(success);
      })
    );
  }
  savePageHTML(html: string, id: string) {
    return this.api.savePageHTML(html, id);
  }
}
