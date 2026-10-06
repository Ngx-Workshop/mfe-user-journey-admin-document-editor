import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { WorkshopPageIdentifierDto } from '@tmdjr/document-contracts';
import { finalize } from 'rxjs';
import { WorkshopEditorService } from '../../../services/workshops.service';
import { reorder } from '../../../view-models/ordering';
import { DeletePageModalComponent } from './modals/delete-page-modal/delete-page-modal.component';
import { EditPageModalComponent } from './modals/edit-page-modal/edit-page-modal.component';

@Component({
  selector: 'ngx-page-list',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, DragDropModule],
  template: `
    <h3 class="page-order__heading">Page List</h3>
    <div
      cdkDropList
      class="page-order__list"
      [cdkDropListDisabled]="pending()"
      (cdkDropListDropped)="onDrop($event)"
    >
      @for (item of documents(); track item._id; let i = $index) {
        <div cdkDrag class="page-order__item">
          <div class="page-order__row">
            <mat-icon cdkDragHandle aria-hidden="true">drag_indicator</mat-icon>
            <a
              class="page-order__link"
              [routerLink]="['../../', workshopDocumentGroupId(), item._id]"
              routerLinkActive="page-order__link--selected"
              >{{ item.name }}</a
            >
            <button
              matIconButton
              type="button"
              [attr.aria-label]="'Edit ' + item.name"
              (click)="editPage($event, item)"
            >
              <mat-icon>edit</mat-icon>
            </button>
            <button
              matIconButton
              type="button"
              [attr.aria-label]="'Delete ' + item.name"
              (click)="deletePage($event, item)"
            >
              <mat-icon>delete</mat-icon>
            </button>
          </div>
          <div class="page-order__actions">
            <button
              matIconButton
              type="button"
              [disabled]="pending() || i === 0"
              [attr.aria-label]="'Move ' + item.name + ' up'"
              (click)="move(i, i - 1)"
            >
              <mat-icon>arrow_upward</mat-icon>
            </button>
            <button
              matIconButton
              type="button"
              [disabled]="pending() || i === documents().length - 1"
              [attr.aria-label]="'Move ' + item.name + ' down'"
              (click)="move(i, i + 1)"
            >
              <mat-icon>arrow_downward</mat-icon>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
      }
      .page-order__heading {
        font-size: 1.3rem;
        font-weight: 100;
        margin: 0.5rem;
        padding: 0.5rem;
        color: var(--mat-sys-primary);
        border-bottom: 1px solid var(--mat-sys-primary);
      }
      .page-order__list {
        display: flex;
        gap: 0.5rem;
        flex-direction: column;
        padding: 1rem;
      }
      .page-order__item {
        border-radius: var(--mat-sys-corner-medium);
        color: var(--mat-sys-on-secondary-container);
      }
      .page-order__item:hover,
      .page-order__item:focus-within {
        background: var(--mat-sys-secondary-container);
      }
      .page-order__row {
        display: flex;
        gap: 4px;
        align-items: center;
      }
      .page-order__link {
        flex: 1;
        color: inherit;
        text-decoration: none;
        overflow-wrap: anywhere;
      }
      .page-order__link--selected {
        color: var(--mat-sys-on-primary-container);
        background: var(--mat-sys-primary-container);
      }
      .page-order__actions {
        display: flex;
        justify-content: flex-end;
      }
    `,
  ],
})
export class PageListComponent {
  readonly documents = input<WorkshopPageIdentifierDto[]>([]);
  readonly pending = signal(false);
  private readonly editor = inject(WorkshopEditorService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  readonly workshopDocumentGroupId = input('');
  readonly workshopDocumentId = input('');
  readonly workshopId = input('');
  private readonly dialogs = inject(MatDialog);

  editPage(event: Event, workshopDocument: WorkshopPageIdentifierDto): void {
    event.preventDefault();
    this.dialogs.open(EditPageModalComponent, {
      width: '400px',
      backdropClass: 'blur-backdrop',
      data: { workshopDocument },
    });
  }
  deletePage(event: Event, workshopDocument: WorkshopPageIdentifierDto): void {
    event.preventDefault();
    this.dialogs.open(DeletePageModalComponent, {
      width: '400px',
      backdropClass: 'blur-backdrop',
      data: { workshopDocument },
    });
  }

  onDrop(event: CdkDragDrop<unknown>): void {
    this.move(event.previousIndex, event.currentIndex);
  }

  move(from: number, to: number): void {
    if (this.pending() || from === to || to < 0 || to >= this.documents().length) return;
    this.pending.set(true);
    const ordered = reorder(this.documents(), from, to);
    this.editor
      .sortDocuments(ordered, this.workshopId())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pending.set(false))
      )
      .subscribe({
        next: () => this.notify('Pages order updated'),
        error: () => this.notify('Could not update the order. Please try again.'),
      });
  }

  private notify(message: string): void {
    this.snackBar.open(message, undefined, {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
    });
  }
}
