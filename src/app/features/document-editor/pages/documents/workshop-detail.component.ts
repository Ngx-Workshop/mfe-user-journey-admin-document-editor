import { signal } from '@angular/core';
import { NgxActionBar, NgxInlineStatus } from '@tmdjr/ngx-workshop-design-system';
import { DocumentPanelComponent } from '../../components/document-panel.component';
import { DocumentViewportDirective } from '../../components/document-viewport.directive';
import { ChangeDetectionStrategy } from '@angular/core';
import { NgxButton } from '@tmdjr/ngx-workshop-design-system';
import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgxEditorJsBlock } from '@tmdjr/ngx-editor-js2';
import { combineLatest, map, shareReplay } from 'rxjs';
import { PageListComponent } from '../../components/workshops-sidepanel/page-list-controls/page-list.component';
import {
  ResolvedWorkshopEntry,
  WorkshopJourneyItem,
} from '../../models/workshop-journey';
import { EditorStateService } from '../../state/editor-state.service';
import { NavigationService } from '../../state/navigation.service';
import {
  journeyViewModel,
  resolvedEntryContent,
} from '../../utils/document-view-model';
import { AssessmentTestPreviewComponent } from './assessment-test-preview.component';
import { CodingLabPreviewComponent } from './coding-lab-preview.component';
import { DocumentEditorComponent } from './document-editor.component';

@Component({
  host: { class: 'ngx-design-system ngx-document-design' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ngx-workshop-detail',
  imports: [NgxActionBar, NgxInlineStatus, DocumentPanelComponent, DocumentViewportDirective,NgxButton,
    AsyncPipe,
    MatPaginatorModule,
    DocumentEditorComponent,
    CodingLabPreviewComponent,
    AssessmentTestPreviewComponent,
    PageListComponent,
    MatIconModule,
    MatButtonModule,
    RouterLink,
  ],
  template: `
    @if (viewModel$ | async; as vm) {
      <ngx-action-bar class="workshop-detail__toolbar" [heading]="vm.document.name">
        <a aria-label="Back to Workshops" title="Back to Workshops" routerLink="../../" mat-flat-button ngxButton surface="outline"
          ><mat-icon>arrow_back</mat-icon><span class="workshop-detail__action-label">Back to Workshops</span></a
        >
        <ngx-inline-status class="workshop-detail__level" ngxActionBarIndicators [label]="'Level ' + vm.workshopLevel" tone="neutral" />
        <ngx-inline-status ngxActionBarIndicators label="Published" tone="neutral" />
        <a
          mat-flat-button ngxButton surface="outline"
          [routerLink]="['../edit-page', vm.document._id]"
          [attr.aria-label]="'Edit ' + vm.document.name"
        >
          <mat-icon>edit</mat-icon><span class="workshop-detail__action-label">Edit Page Settings</span>
        </a>
        <a
          mat-flat-button ngxButton surface="outline"
          aria-label="Create New Page" title="Create New Page"
          routerLink="../create-page"
          [queryParams]="{ returnPage: vm.document._id }"
        >
          <mat-icon>note_add</mat-icon><span class="workshop-detail__action-label">Create New Page</span>
        </a>
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
      </ngx-action-bar>
      <main class="document-layout"><div class="document-layout__workspace workshop-detail__workspace" ngxDocumentViewport>
      @if (saves.pending()) {
        <p role="status">Saving page changes…</p>
      }
      @if (saves.hasFailed(vm.document._id)) {
        <p class="workshop-detail__error" role="alert">
          Could not save this page. Your latest changes are available
          to retry.
        </p>
        <button mat-flat-button ngxButton surface="outline" (click)="saves.retry(vm.document._id)">
          Retry saving page
        </button>
      }
      <div class="workshop-detail__switch" role="group" aria-label="Document panels"><button mat-button [attr.aria-pressed]="pane() === 'editor'" (click)="pane.set('editor')">Content</button><button mat-button [attr.aria-pressed]="pane() === 'pages'" (click)="pane.set('pages')">Pages</button></div>
      <div class="workshop-detail__content">
        <ngx-document-panel heading="Page outline" eyebrow="DOCUMENTS / NAVIGATION" shape="chamfered" [class.workshop-detail__hidden]="pane() !== 'pages'">
        <ngx-page-list (pageSelected)="pane.set('editor')" [workshopDocumentGroupId]="vm.workshopDocumentGroupId" [workshopDocumentId]="vm.document._id" [documents]="vm.documents" [workshopId]="vm.workshopId" />
        </ngx-document-panel>
        <ngx-document-panel [heading]="vm.document.name" eyebrow="DOCUMENTS / AUTHORING" background="grid" [resetKey]="vm.document._id" [class.workshop-detail__hidden]="pane() !== 'editor'">
        @if (vm.error) {
          <p class="workshop-detail__error" role="alert">
            {{ vm.error }}
          </p>
        } @else if (vm.document.kind === 'ASSESSMENT_TEST') {
          <ngx-assessment-test-preview
            [resourceId]="vm.document.resourceId"
            [pageName]="vm.document.name"
          />
        } @else if (vm.document.kind === 'CODING_LAB') {
          <ngx-coding-lab-preview
            [resourceId]="vm.document.resourceId"
            [pageName]="vm.document.name"
          />
        } @else {
          <ngx-document-editor
            [blocks]="vm.blocks"
            (blocksChanged)="handleSavingBlocks($event, vm.document)"
          />
        }
        </ngx-document-panel>
      </div>
      </div></main>
    } @else {
      <p role="status">Loading page…</p>
    }
  `,
  styles: [`
    :host { display: block; min-width: 0; color: var(--ngx-color-text); background: var(--ngx-color-canvas); }
    ngx-action-bar { --ngx-action-bar-top: 96px; }
    .document-layout { padding: 1rem; }
    .document-layout__workspace { min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); gap: 1rem; }
    @media (max-width: 720px) {
      ngx-action-bar { --ngx-action-bar-top: 76px; gap: 4px; }
      ngx-action-bar a, ngx-action-bar button { min-width: 0; padding-inline: 8px; font-size: 0.7rem; }
      .document-layout { padding: 0.5rem; }
    }
    .workshop-detail__workspace { display: flex; flex-direction: column; gap: 8px; }
    .workshop-detail__content { flex: 1; display: grid; grid-template-columns: 300px minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); min-height: 0; gap: 1rem; }
    .workshop-detail__error { color: var(--ngx-color-error); margin: 0; }
    .workshop-detail__switch { display: none; }
    .workshop-detail__paginator { background: transparent; }
    @media (max-width: 1000px) {
      .workshop-detail__content { grid-template-columns: minmax(0, 1fr); }
      .workshop-detail__switch { display: flex; }
      .workshop-detail__switch button[aria-pressed='true'] { background: var(--ngx-color-surface-high); }
      ngx-document-panel { grid-column: 1; grid-row: 1; }
      .workshop-detail__hidden { display: none; }
    }
    @media (max-width: 600px) {
      .workshop-detail__action-label { display: none; }
      ngx-action-bar a { height: 40px; min-width: 40px; padding-inline: 8px; }
      .workshop-detail__paginator { --mat-paginator-container-size: 40px; }
    }

  `],

})
export class WorkshopDetailComponent {
  readonly pane = signal<'editor' | 'pages'>('editor');
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
