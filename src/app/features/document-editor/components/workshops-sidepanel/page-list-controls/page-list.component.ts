import { ChangeDetectionStrategy } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import {
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { finalize } from 'rxjs';
import { WorkshopJourneyItem } from '../../../models/workshop-journey';
import { WorkshopEditorService } from '../../../state/workshops.service';
import { reorder } from '../../../utils/ordering';
import { DeletePageModalComponent } from './modals/delete-page-modal/delete-page-modal.component';

@Component({
  host: { class: 'ngx-design-system ngx-document-design' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ngx-page-list',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    DragDropModule,
  ],
  template: `
    <h3 class="page-order__heading">Pages</h3>
    <div
      cdkDropList
      class="page-order__list"
      [cdkDropListDisabled]="pending()"
      (cdkDropListDropped)="onDrop($event)"
    >
      @for (item of documents(); track item._id; let i = $index) {
        <div cdkDrag class="page-order__item">
          <div class="page-order__row">
            <mat-icon
              cdkDragHandle
              aria-hidden="true"
              class="page-order__drag-handle"
              >drag_indicator</mat-icon
            >
            <a
              class="page-order__link" [title]="item.name" (click)="pageSelected.emit()"
              [routerLink]="[
                '../../',
                workshopDocumentGroupId(),
                item._id,
              ]"
              routerLinkActive="page-order__link--selected"
              >{{ item.name }}</a
            >
            <button
              matIconButton
              type="button"
              [attr.aria-label]="'Delete ' + item.name"
              (click)="deletePage($event, item)"
            >
              <mat-icon>delete</mat-icon>
            </button>

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
  styles: [`
    :host { display: block; min-width: 0; }
    .page-order__heading { font-family: var(--ngx-font-heading); font-size: 0.8rem; margin: 4px 0 8px; }
    .page-order__list { display: grid; grid-template-columns: minmax(0, 1fr); gap: 4px; }
    .page-order__item { border-bottom: 1px solid var(--ngx-color-border); min-width: 0; background: var(--ngx-color-surface); }
    .page-order__row { display: flex; align-items: center; gap: 4px; min-width: 0; padding: 4px; }
    .page-order__link { flex: 1; min-width: 0; font-size: 0.75rem; color: var(--ngx-color-text); text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 6px 2px; }
    .page-order__link--selected { color: var(--ngx-color-primary); font-weight: 600; }
    .page-order__drag-handle { cursor: grab; flex-shrink: 0; color: var(--ngx-color-muted); }
    .page-order__link:focus-visible { outline: 2px solid var(--ngx-color-primary); }

  `],

})
export class PageListComponent {
  readonly pageSelected = output<void>();
  readonly documents = input<WorkshopJourneyItem[]>([]);
  readonly pending = signal(false);
  private readonly editor = inject(WorkshopEditorService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  readonly workshopDocumentGroupId = input('');
  readonly workshopDocumentId = input('');
  readonly workshopId = input('');
  private readonly dialogs = inject(MatDialog);

  deletePage(
    event: Event,
    workshopDocument: WorkshopJourneyItem
  ): void {
    event.preventDefault();
    this.dialogs.open(DeletePageModalComponent, {
      width: '400px',
      backdropClass: 'blur-backdrop',
      panelClass: 'ngx-design-system-overlay',
      data: { workshopDocument },
    });
  }

  onDrop(event: CdkDragDrop<unknown>): void {
    this.move(event.previousIndex, event.currentIndex);
  }

  move(from: number, to: number): void {
    if (
      this.pending() ||
      from === to ||
      to < 0 ||
      to >= this.documents().length
    )
      return;
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
        error: () =>
          this.notify(
            'Could not update the order. Please try again.'
          ),
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
