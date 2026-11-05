import { ChangeDetectionStrategy } from '@angular/core';
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
  host: { class: 'ngx-design-system ngx-document-design' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ngx-workshop-list-control',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    DragDropModule,
  ],
  template: `
    <h3 class="workshop-order__heading">Workshops</h3>
    <div
      cdkDropList
      class="workshop-order__list"
      [cdkDropListDisabled]="pending()"
      (cdkDropListDropped)="onDrop($event)"
    >
      @for (item of workshops(); track item._id; let i = $index) {
        <div cdkDrag class="workshop-order__item">
          <div class="workshop-order__row">
            <mat-icon
              cdkDragHandle
              aria-hidden="true"
              class="workshop-order__drag-handle"
              >drag_indicator</mat-icon
            >
            <a
              class="workshop-order__link" [title]="item.name"
              [routerLink]="[
                '../',
                item.workshopDocumentGroupId,
                item.workshopDocuments[0]?._id || '',
              ]"
              routerLinkActive="workshop-order__link--selected"
              >{{ item.name }}</a
            >

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
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .workshop-order__heading { font-family: var(--ngx-font-heading); font-size: 0.8rem; margin: 4px 0 8px; }
    .workshop-order__list { display: grid; grid-template-columns: minmax(0, 1fr); gap: 4px; }
    .workshop-order__item { border-bottom: 1px solid var(--ngx-color-border); min-width: 0; background: var(--ngx-color-surface); }
    .workshop-order__row { display: flex; align-items: center; gap: 4px; min-width: 0; padding: 4px; }
    .workshop-order__link { flex: 1; min-width: 0; font-size: 0.75rem; color: var(--ngx-color-text); text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 6px 2px; }
    .workshop-order__link--selected { color: var(--ngx-color-primary); font-weight: 600; }
    .workshop-order__drag-handle { cursor: grab; flex-shrink: 0; color: var(--ngx-color-muted); }
    .workshop-order__link:focus-visible { outline: 2px solid var(--ngx-color-primary); }

  `],

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
