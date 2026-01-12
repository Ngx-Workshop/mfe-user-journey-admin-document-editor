import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

import {
  Component,
  inject,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import {
  MatSnackBar,
  MatSnackBarConfig,
} from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { from, of, Subject, switchMap, take, takeUntil } from 'rxjs';
import { Workshop } from '../../../navigation.interface';
import { NavigationService } from '../../../services/navigation.service';
import { WorkshopEditorService } from '../../../services/workshops.service';
import { CreateWorkshopModalComponent } from './modals/create-category-modal/create-workshop-modal.component';
import { DeleteWorkshopModalComponent } from './modals/delete-category-modal/delete-workshop-modal.component';
import { EditWorkshopModalComponent } from './modals/edit-category-modal/edit-workshop-modal.component';

@Component({
  selector: 'ngx-workshop-list-control',
  templateUrl: './workshop-list-control.component.html',
  styleUrls: ['./workshop-list-control.component.scss'],
  imports: [
    RouterModule,
    MatListModule,
    MatIconModule,
    DragDropModule
],
})
export class WorkshopListControlsComponent
  implements OnInit, OnDestroy
{
  matDialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  workshopEditorService = inject(WorkshopEditorService);

  // TODO: Make it Reactive
  // ! Make this more generic so that it can be used for other components
  destory: Subject<boolean> = new Subject();

  cdkDragDisabled = false;

  snackBarOptiions: MatSnackBarConfig = {
    duration: 3000,
    horizontalPosition: 'right',
    verticalPosition: 'top',
  };

  sortWorkshopFormError$ = new Subject<boolean>();
  sortWorkshopFormSuccess$ = new Subject<boolean>();

  @Input() workshops: Workshop[] = [];

  navigationService = inject(NavigationService);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}

  ngOnInit(): void {
    this.initSortCategories();
  }

  ngOnDestroy(): void {
    this.destory.next(true);
  }

  createWorkshop(): void {
    this.matDialog.open(CreateWorkshopModalComponent, {
      width: '400px',
      backdropClass: 'blur-backdrop',
    });
  }

  deleteWorkshop(event: Event, workshop: Workshop): void {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.matDialog.open(DeleteWorkshopModalComponent, {
      width: '400px',
      backdropClass: 'blur-backdrop',
      data: { workshop },
    });
  }

  editWorkshop(event: Event, workshop: Workshop): void {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.matDialog.open(EditWorkshopModalComponent, {
      width: '400px',
      backdropClass: 'blur-backdrop',
      data: { workshop },
    });
  }

  onDrop(
    event: CdkDragDrop<
      { previousIndex: number; currentIndex: number }[]
    >
  ) {
    this.cdkDragDisabled = true;
    const workshops = this.workshops ?? [];
    moveItemInArray(
      workshops,
      event.previousIndex,
      event.currentIndex
    );
    this.workshops?.map(
      (workshop, index) => (workshop.sortId = index)
    );
    this.workshopEditorService.sortWorkshops(workshops).subscribe({
      error: () => {
        this.sortWorkshopFormError$.next(true);
      },
      complete: () => {
        from(this.navigationService.getCurrentSection().pipe(take(1)))
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
        this.sortWorkshopFormSuccess$.next(true);
      },
    });
  }

  initSortCategories(): void {
    this.sortWorkshopFormError$
      .pipe(takeUntil(this.destory))
      .subscribe(() => {
        this.snackBar.open(
          '😿 Error updating the workshops new order',
          undefined,
          this.snackBarOptiions
        );
        this.cdkDragDisabled = false;
      });

    this.sortWorkshopFormSuccess$
      .pipe(takeUntil(this.destory))
      .subscribe(() => {
        this.snackBar.open(
          '😸 Categories new order updated',
          undefined,
          this.snackBarOptiions
        );
        this.cdkDragDisabled = false;
      });
  }
}
