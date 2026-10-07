import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import {
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { WorkshopDto } from '@tmdjr/document-contracts';
import { finalize } from 'rxjs';
import { WorkshopEditorService } from '../../../state/workshops.service';
import { reorder } from '../../../utils/ordering';

@Component({
  selector: 'ngx-workshop-list-control',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    DragDropModule,
  ],
  template: `
    <h3 class="workshop-order__heading">Workshop List's Order</h3>
    <div
      cdkDropList
      class="workshop-order__list"
      [cdkDropListDisabled]="pending()"
      (cdkDropListDropped)="onDrop($event)"
    >
      @for (item of workshops(); track item._id; let i = $index) {
        <button
          matButton="filled"
          cdkDrag
          class="workshop-order__item"
        >
          <div class="workshop-order__row">
            <mat-icon
              cdkDragHandle
              aria-hidden="true"
              class="workshop-order__drag-handle"
              >drag_indicator</mat-icon
            >
            <a
              class="workshop-order__link"
              [routerLink]="[
                '../',
                item.workshopDocumentGroupId,
                item.workshopDocuments[0]?._id || '',
              ]"
              routerLinkActive="workshop-order__link--selected"
              >{{ item.name }}</a
            >
          </div>
          <!-- <div class="workshop-order__actions">
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
              [disabled]="pending() || i === workshops().length - 1"
              [attr.aria-label]="'Move ' + item.name + ' down'"
              (click)="move(i, i + 1)"
            >
              <mat-icon>arrow_downward</mat-icon>
            </button>
          </div> -->
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        margin-top: 1rem;
      }
      .workshop-order__heading {
        font-size: 1.3rem;
        font-weight: 100;
        margin: 0.5rem;
        padding: 0.5rem;
        color: var(--mat-sys-primary);
        border-bottom: 1px solid var(--mat-sys-primary);
      }
      .workshop-order__list {
        display: flex;
        gap: 0.5rem;
        flex-direction: column;
        padding: 0.4rem 1rem;
      }
      .workshop-order__item {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        font-size: 1rem;
        padding: 1.4rem 0.6rem;
        border-radius: var(--mat-sys-corner-full);
        color: var(--mat-sys-on-secondary-container);
        background: var(--mat-sys-secondary-container);
      }
      .workshop-order__item:hover,
      .workshop-order__item:focus-within {
        background: var(--mat-sys-primary-container);
      }
      .workshop-order__row {
        display: flex;
        gap: 4px;
        align-items: center;
      }
      .workshop-order__link {
        flex: 1;
        color: inherit;
        text-decoration: none;
        overflow-wrap: anywhere;
      }
      .workshop-order__link--selected {
        color: var(--mat-sys-on-primary-container);
        background: var(--mat-sys-primary-container);
      }
      .workshop-order__actions {
        display: flex;
        justify-content: flex-end;
      }
      .workshop-order__drag-handle {
        cursor: grab;
      }
    `,
  ],
})
export class WorkshopListControlsComponent {
  readonly workshops = input<WorkshopDto[]>([]);
  readonly pending = signal(false);
  private readonly editor = inject(WorkshopEditorService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  onDrop(event: CdkDragDrop<unknown>): void {
    this.move(event.previousIndex, event.currentIndex);
  }

  move(from: number, to: number): void {
    if (
      this.pending() ||
      from === to ||
      to < 0 ||
      to >= this.workshops().length
    )
      return;
    this.pending.set(true);
    const ordered = reorder(this.workshops(), from, to);
    this.editor
      .sortWorkshops(ordered)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pending.set(false))
      )
      .subscribe({
        next: () => this.notify('Workshops order updated'),
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
