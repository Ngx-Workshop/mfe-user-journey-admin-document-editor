import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

import {
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import {
  MatSnackBar,
  MatSnackBarConfig,
} from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { WorkshopPageIdentifierDto } from '@tmdjr/document-contracts';
import { from, of, Subject, switchMap, take, takeUntil } from 'rxjs';
import { NavigationService } from '../../../services/navigation.service';
import { WorkshopEditorService } from '../../../services/workshops.service';
import { DeletePageModalComponent } from './modals/delete-page-modal/delete-page-modal.component';
import { EditPageModalComponent } from './modals/edit-page-modal/edit-page-modal.component';

@Component({
  selector: 'ngx-page-list',
  templateUrl: './page-list.component.html',
  styleUrls: ['./page-list.component.scss'],
  imports: [
    RouterModule,
    MatListModule,
    MatIconModule,
    DragDropModule,
    MatButtonModule,
  ],
})
export class PageListComponent implements OnInit, OnDestroy {
  private readonly matDialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly workshopEditorService = inject(
    WorkshopEditorService
  );

  private readonly destory$: Subject<boolean> = new Subject();
  private readonly sortDocumentFormError$ = new Subject<boolean>();
  private readonly sortDocumentFormSuccess$ = new Subject<boolean>();

  private readonly snackBarOptions: MatSnackBarConfig = {
    duration: 3000,
    horizontalPosition: 'right',
    verticalPosition: 'bottom',
  };

  readonly documents = input<WorkshopPageIdentifierDto[]>([]);
  readonly workshopDocumentGroupId = input('');
  readonly workshopDocumentId = input('');
  readonly workshopId = input('');

  navigationService = inject(NavigationService);

  ngOnInit(): void {
    this.initSortPages();
  }

  ngOnDestroy(): void {
    this.destory$.next(true);
  }

  editPage(event: Event, workshopDocument: unknown): void {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.matDialog.open(EditPageModalComponent, {
      width: '400px',
      backdropClass: 'blur-backdrop',
      data: { workshopDocument },
    });
  }

  deletePage(event: Event, workshopDocument: unknown): void {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.matDialog.open(DeletePageModalComponent, {
      width: '400px',
      backdropClass: 'blur-backdrop',
      data: { workshopDocument },
    });
  }

  onDrop(
    event: CdkDragDrop<
      { previousIndex: number; currentIndex: number }[]
    >
  ) {
    const documents = this.documents() ?? [];
    moveItemInArray(
      documents,
      event.previousIndex,
      event.currentIndex
    );
    this.documents()?.map(
      (document, index) => (document.sortId = index)
    );
    this.workshopEditorService
      .sortDocuments(documents, this.workshopId())
      .subscribe({
        error: () => {
          this.sortDocumentFormError$.next(true);
        },
        complete: () => {
          from(
            this.navigationService.getCurrentSection().pipe(take(1))
          )
            .pipe(
              switchMap((section) => {
                if (section && section._id) {
                  return this.navigationService.navigateToSection(
                    section._id,
                    true
                  );
                }
                return of(null);
              }),
              take(1)
            )
            .subscribe();
          this.sortDocumentFormSuccess$.next(true);
        },
      });
  }

  initSortPages(): void {
    this.sortDocumentFormError$
      .pipe(takeUntil(this.destory$))
      .subscribe(() => {
        this.snackBar.open(
          '😿 Error updating the categories new order',
          undefined,
          this.snackBarOptions
        );
      });

    this.sortDocumentFormSuccess$
      .pipe(takeUntil(this.destory$))
      .subscribe(() => {
        this.snackBar.open(
          '😸 Categories new order updated',
          undefined,
          this.snackBarOptions
        );
      });
  }
}
