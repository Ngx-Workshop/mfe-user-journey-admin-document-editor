import { CommonModule } from '@angular/common';
import { Component, inject, viewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
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
  of,
  switchMap,
  tap,
} from 'rxjs';
import {
  WorkshopDocument,
  WorkshopDocumentIdentifier,
} from '../../navigation.interface';
import { NavigationService } from '../../services/navigation.service';
import { WorkshopEditorService } from '../../services/workshops.service';
import { CreatePageModalComponent } from '../workshops-sidepanel/page-list-controls/modals/create-page-modal/create-page-modal.component';
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
      <div class="flex-spacer"></div>
      <mat-chip class="chip-published">Published</mat-chip>
      @if(vm.hasMoreThanOneDocument) {
      <mat-paginator
        #paginator
        class="paginator"
        [length]="vm.workshopDocumentsLength"
        [showFirstLastButtons]="true"
        [hidePageSize]="true"
        [pageSize]="1"
        [pageIndex]="vm.pageIndex"
        (page)="pageEventChange($event, vm.documents)"
        aria-label="Select page"
      />
      <button matButton="filled" (click)="createPage()">
        <mat-icon>note_add</mat-icon>
        Create New Page
      </button>
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
              (formChanged)="handleSavingBlocks($event, vm.document)"
            />
          </div>
        </div>
      </div>
      <ngx-page-list
        class="page-list-sidepanel"
        [workshopDocumentGroupId]="vm.workshopDocumentGroupId"
        [workshopDocumentId]="vm.workshopDocumentId"
        [documents]="vm.documents"
        [workshopId]="vm.workshopId"
      />
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
      .paginator {
        @include mat.paginator-overrides(
          (
            container-text-color: var(--mat-sys-on-primary),
            enabled-icon-color: var(--mat-sys-on-primary),
          )
        );
      }
      .workshop-detail-content {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 320px;
        column-gap: 24px;
        align-items: start;
      }
      .workshop-viewer-container {
        display: flex;
        justify-content: space-around;
        margin-top: 24px;
        .workshop-detail-card {
          background: var(--mat-sys-surface-container-low);
          padding: 1.5rem;
          border-radius: var(
            --mat-card-elevated-container-shape,
            var(--mat-sys-corner-medium)
          );
          margin-bottom: 2rem;

          max-width: 750px;
        }
      }
      .page {
        min-width: 0;
      }
      .page-list-sidepanel {
        position: sticky;
        top: 112px;
        width: 320px;
      }
      .action-bar {
        position: sticky;
        top: 56px;
        height: 56px;
        z-index: 5;
        display: flex;
        flex-direction: row;
        width: 100%;
        background: var(--mat-sys-primary);
        align-items: center;
        a,
        button,
        mat-chip,
        .paginator {
          color: var(--mat-sys-on-primary);
          background: var(--mat-sys-primary);
          margin: 0 12px;
        }
      }
    `,
  ],
})
export class WorkshopDetailComponent {
  readonly paginator = viewChild.required<MatPaginator>('paginator');

  private workshopEditorService = inject(WorkshopEditorService);
  private matDialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
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
        document,
        documents,
        ngxEditorjsBlocks: safeParse(document.html),
        hasMoreThanOneDocument: documents.length > 1,
        workshopDocumentsLength: documents.length,
        workshopId: workshop?._id || '',
        workshopDocumentGroupId:
          workshop?.workshopDocumentGroupId || '',
        workshopDocumentId: document._id,
        isExam: document.pageType === 'EXAM',
        pageIndex: documents.findIndex(
          (workshopDocument) => workshopDocument._id === document._id
        ),
      };
    })
  );

  createPage(): void {
    this.matDialog.open(CreatePageModalComponent, {
      width: '400px',
      backdropClass: 'blur-backdrop',
    });
  }

  pageEventChange(
    { pageIndex }: PageEvent,
    documents: WorkshopDocumentIdentifier[]
  ): void {
    this.router.navigate(['../', documents[pageIndex]._id], {
      relativeTo: this.activatedRoute,
    });
  }

  handleSavingBlocks(
    blocks: NgxEditorJsBlock[],
    document: WorkshopDocument
  ): void {
    void lastValueFrom(
      of(blocks).pipe(
        switchMap((blocks) =>
          this.workshopEditorService.savePageHTML(
            safeStringify(blocks),
            document._id
          )
        ),
        tap(() =>
          this.snackBar.open('Save Successful', undefined, {
            duration: 300,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: 'snackbar-success',
          })
        ),
        catchError(() => {
          this.snackBar.open('😿 Error saving workshop', undefined, {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: 'snackbar-failure',
          });
          return of([]);
        })
      )
    );
  }
}
