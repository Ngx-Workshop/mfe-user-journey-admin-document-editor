import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import {
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgxEditorJsBlock } from '@tmdjr/ngx-editor-js2';
import { combineLatest, map, shareReplay } from 'rxjs';
import {
  ResolvedWorkshopEntry,
  WorkshopJourneyItem,
} from '../../../models/workshop-journey';
import { EditorStateService } from '../../../services/editor-state.service';
import { NavigationService } from '../../../services/navigation.service';
import {
  journeyViewModel,
  resolvedEntryContent,
} from '../../../view-models/document-view-model';
import { PageListComponent } from '../../workshops-sidepanel/page-list-controls/page-list.component';
import { AssessmentTestPreviewComponent } from './assessment-test-preview.component';
import { DocumentEditorComponent } from './document-editor.component';
import { ExternalPagePlaceholderComponent } from './external-page-placeholder.component';

@Component({
  selector: 'ngx-workshop-detail',
  imports: [
    AsyncPipe,
    MatPaginatorModule,
    DocumentEditorComponent,
    ExternalPagePlaceholderComponent,
    AssessmentTestPreviewComponent,
    PageListComponent,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    MatChipsModule,
  ],
  template: `
    @if (viewModel$ | async; as vm) {
    <div class="workshop-detail__toolbar">
      <a routerLink="../../" matButton="filled"
        ><mat-icon>arrow_back</mat-icon>Back to Workshops</a
      >
      <div class="workshop-detail__spacer"></div>
      <mat-chip class="workshop-detail__published"
        >Published</mat-chip
      >
      @if (vm.documents.length > 1) {
      <mat-paginator
        class="workshop-detail__paginator"
        [length]="vm.documents.length"
        [showFirstLastButtons]="true"
        [hidePageSize]="true"
        [pageSize]="1"
        [pageIndex]="vm.pageIndex"
        (page)="pageEventChange($event, vm.documents)"
        aria-label="Select page"
      />
      }
      <a
        matButton="filled"
        [routerLink]="['../edit-page', vm.document._id]"
        [attr.aria-label]="'Edit ' + vm.document.name"
      >
        <mat-icon>edit</mat-icon>Edit Page Settings
      </a>
      <a
        matButton="filled"
        routerLink="../create-page"
        [queryParams]="{ returnPage: vm.document._id }"
      >
        <mat-icon>note_add</mat-icon>Create New Page
      </a>
    </div>
    @if (saves.pending()) {
    <p role="status">Saving page changes…</p>
    } @if (saves.hasFailed(vm.document._id)) {
    <p class="workshop-detail__error" role="alert">
      Could not save this page. Your latest changes are available to
      retry.
    </p>
    <button matButton (click)="saves.retry(vm.document._id)">
      Retry saving page
    </button>
    }
    <div class="workshop-detail__content">
      @if (vm.error) {
      <p class="workshop-detail__error" role="alert">
        {{ vm.error }}
      </p>
      } @else if (vm.document.kind === 'ASSESSMENT_TEST') {
      <ngx-assessment-test-preview
        [resourceId]="vm.document.resourceId"
        [pageName]="vm.document.name"
      />
      } @else if (vm.kind !== 'PAGE') {
      <ngx-external-page-placeholder [entry]="vm.document" />
      } @else {
      <ngx-document-editor
        [blocks]="vm.blocks"
        (blocksChanged)="handleSavingBlocks($event, vm.document)"
      />
      }
      <ngx-page-list
        class="workshop-detail__sidebar"
        [workshopDocumentGroupId]="vm.workshopDocumentGroupId"
        [workshopDocumentId]="vm.document._id"
        [documents]="vm.documents"
        [workshopId]="vm.workshopId"
      />
    </div>
    } @else {
    <p role="status">Loading page…</p>
    }
  `,
  styles: [
    `
      @use '@angular/material' as mat;
      .workshop-detail__published {
        @include mat.chips-overrides(
          (
            label-text-color: var(--mat-sys-primary-container),
            outline-color: var(--mat-sys-primary-container),
          )
        );
      }
      .workshop-detail__paginator {
        @include mat.paginator-overrides(
          (
            container-text-color: var(--mat-sys-on-primary),
            enabled-icon-color: var(--mat-sys-on-primary),
          )
        );
      }
      .workshop-detail__content {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 460px;
        gap: 24px;
        align-items: start;
      }
      .workshop-detail__sidebar {
        position: sticky;
        top: 112px;
        width: 320px;
      }
      .workshop-detail__toolbar {
        position: sticky;
        top: 56px;
        min-height: 56px;
        z-index: 5;
        display: flex;
        width: 100%;
        background: var(--mat-sys-primary);
        align-items: center;
        a,
        button,
        mat-chip,
        .workshop-detail__paginator {
          color: var(--mat-sys-on-primary);
          background: var(--mat-sys-primary);
          margin: 0 12px;
        }
      }
      .workshop-detail__spacer {
        flex: 1;
      }
      .workshop-detail__error {
        color: var(--mat-sys-error);
      }
      @media (max-width: 900px) {
        .workshop-detail__content {
          grid-template-columns: 1fr;
        }
        .workshop-detail__sidebar {
          position: static;
          width: 100%;
        }
        .workshop-detail__toolbar {
          flex-wrap: wrap;
        }
      }
    `,
  ],
})
export class WorkshopDetailComponent {
  readonly saves = inject(EditorStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly viewModel$ = combineLatest([
    this.route.data.pipe(
      map((data) =>
        resolvedEntryContent(
          data['documentResolver'] as ResolvedWorkshopEntry
        )
      )
    ),
    inject(NavigationService).getCurrentWorkshop(),
  ]).pipe(
    map(([content, workshop]) => journeyViewModel(content, workshop)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor() {
    this.saves.notices$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((notice) => {
        if (this.route.snapshot.params['documentId'] !== notice.id)
          return;
        this.snackBar.open(
          notice.success ? 'Save Successful' : 'Error saving page',
          undefined,
          {
            duration: notice.success ? 300 : 3000,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: notice.success
              ? 'snackbar-success'
              : 'snackbar-failure',
          }
        );
      });
  }

  pageEventChange(
    { pageIndex }: PageEvent,
    documents: WorkshopJourneyItem[]
  ): void {
    const document = documents[pageIndex];
    if (document)
      void this.router.navigate(['../', document._id], {
        relativeTo: this.route,
      });
  }

  handleSavingBlocks(
    blocks: NgxEditorJsBlock[],
    document: WorkshopJourneyItem
  ): void {
    if (document.kind === 'PAGE')
      this.saves.save(document._id, blocks);
  }
}
