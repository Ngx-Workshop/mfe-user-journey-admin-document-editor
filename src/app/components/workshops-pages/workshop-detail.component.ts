import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIcon } from '@angular/material/icon';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  NgxEditorJs2Component,
  NgxEditorJsBlock,
} from '@tmdjr/ngx-editor-js2';
import {
  catchError,
  combineLatest,
  lastValueFrom,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { WorkshopDocument } from '../../navigation.interface';
import { NavigationService } from '../../services/navigation.service';
import { WorkshopEditorService } from '../../services/workshops.service';
import { PageListComponent } from '../workshops-sidepanel/page-list-controls/page-list.component';

const safeParse = (json: string) => {
  try {
    return JSON.parse(json);
  } catch (error) {
    throw new Error('Error parsing JSON');
  }
};

const safeStringify = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch (error) {
    throw new Error('Error stringify JSON');
  }
};
@Component({
  selector: 'ngx-workshop-detail',
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatCardModule,
    NgxEditorJs2Component,
    PageListComponent,
    MatIcon,
    MatButton,
    RouterLink,
    MatChipsModule,
  ],
  template: `
    @if(viewModel | async; as vm) {
    <div class="action-bar">
      <a routerLink="../../" matButton="filled">
        <mat-icon>arrow_back</mat-icon>Back to Workshops</a
      >
      <mat-chip class="chip-published">Published</mat-chip>
      <button matButton="filled">New Page</button>
      <div class="flex-spacer"></div>
      @if(vm.hasMoreThanOneDocument) {
      <mat-paginator
        #paginator
        [length]="vm.workshopDocumentsLength"
        [showFirstLastButtons]="true"
        [hidePageSize]="true"
        [pageSize]="1"
        [pageIndex]="vm.pageIndex"
        (page)="vm.pageEventChange($event)"
        aria-label="Select page"
      >
      </mat-paginator>
      }
    </div>
    <div class="workshop-detail-content">
      <div class="page">
        <div class="workshop-viewer-container">
          <div class="workshop-detail-card ngx-mat-card">
            <!-- {{ vm.isExam ? 'Exam' : 'Page' }} -->
            <ngx-editor-js2
              [blocks]="vm.ngxEditorjsBlocks"
              [requestBlocks]="requestValue | async"
              (blocksRequested)="vm.handleSavingBlocks($event)"
            ></ngx-editor-js2>
          </div>
        </div>
      </div>
      <ngx-page-list
        [workshopDocumentGroupId]="vm.workshopDocumentGroupId"
        [workshopDocumentId]="vm.workshopDocumentId"
        [documents]="vm.documents"
      ></ngx-page-list>
    </div>
    } @else { LOADING!!! }
  `,
  styles: [
    `
      @use '@angular/material' as mat;
      .chip-published {
        @include mat.chips-overrides(
          (
            label-text-color: var(--mat-sys-primary-container),
            outline-color: var(--mat-sys-primary-container),
          )
        );
      }
      :host {
        width: 100%;
      }
      .workshop-detail-content {
        display: flex;
        justify-content: space-evenly;
        margin-top: 2rem;
      }
      .workshop-viewer-container {
        display: block;
        padding: 12px 60px;

        .workshop-detail-card {
          background: var(--mat-sys-surface-container-low);
          padding: 1.5rem;
          border-radius: var(
            --mat-card-elevated-container-shape,
            var(--mat-sys-corner-medium)
          );
          margin-bottom: 2rem;

          max-width: 750px;
          transition: box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1);
          display: block;
          position: relative;
          margin-bottom: 22px;
        }
      }
      .action-bar {
        position: sticky;
        top: 56px;
        z-index: 5;
        display: flex;
        flex-direction: row;
        width: 100%;
        background: var(--mat-sys-primary);
        align-items: center;
        a,
        button,
        mat-paginator {
          // color: var(--mat-sys-on-primary);
          color: var(--mat-sys-on-primary);
          background: var(--mat-sys-primary);
          margin: 0 12px;
        }
      }
    `,
  ],
})
export class WorkshopDetailComponent {
  @ViewChild('paginator') paginator!: MatPaginator;

  private workshopEditorService = inject(WorkshopEditorService);
  private navigationService = inject(NavigationService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  requestValue = this.workshopEditorService.saveEditorData$;

  viewModel = combineLatest([
    inject(ActivatedRoute).data,
    inject(NavigationService).getCurrentWorkshop(),
  ]).pipe(
    map(([blocks, workshop]) => {
      return {
        document: blocks['documentResolver'] as WorkshopDocument,
        documents: workshop?.workshopDocuments,
        workshop,
      };
    }),
    map(({ document, documents = [], workshop }) => {
      return {
        documents,
        ngxEditorjsBlocks: safeParse(document.html),
        hasMoreThanOneDocument: documents.length > 1,
        workshopDocumentsLength: documents.length,
        workshopDocumentGroupId:
          workshop?.workshopDocumentGroupId || '',
        workshopDocumentId: document._id,
        isExam: document.pageType === 'EXAM',
        pageIndex: documents.findIndex(
          (workshopDocument) => workshopDocument._id === document._id
        ),
        pageEventChange: ({ pageIndex }: PageEvent) => {
          this.router.navigate(['../', documents[pageIndex]._id], {
            relativeTo: this.activatedRoute,
          });
        },
        handleSavingBlocks: (
          blocks$: Observable<NgxEditorJsBlock[]>
        ) => {
          void lastValueFrom(
            blocks$.pipe(
              switchMap((blocks) =>
                this.workshopEditorService.savePageHTML(
                  safeStringify(blocks),
                  document._id
                )
              ),
              tap(() =>
                this.workshopEditorService.savePageHTMLSuccessSubject.next(
                  true
                )
              ),
              catchError(() => {
                this.workshopEditorService.savePageHTMLErrorSubject.next(
                  true
                );
                return of([]);
              })
            )
          );
        },
      };
    })
  );
}
