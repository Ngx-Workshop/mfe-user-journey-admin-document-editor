import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { WorkshopDto } from '@tmdjr/document-contracts';
import { map } from 'rxjs';
import { NavigationService } from '../../../services/navigation.service';
import { DeleteWorkshopModalComponent } from '../../workshops-sidepanel/workshop-list-controls/delete-workshop-modal.component';
import { WorkshopListControlsComponent } from '../../workshops-sidepanel/workshop-list-controls/workshop-list-control.component';
import { WorkshopCardComponent } from './workshop-card.component';
export { OptimizeCloudinaryUrlPipe } from './optimize-cloudinary-url.pipe';

@Component({
  selector: 'ngx-workshop-list',
  imports: [
    AsyncPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    WorkshopListControlsComponent,
    WorkshopCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="workshop-catalog__toolbar">
      <a routerLink="../../" matButton="filled"
        ><mat-icon>arrow_back</mat-icon> Back to Sections</a
      >
      <div class="workshop-catalog__spacer"></div>
      <a matButton="filled" routerLink="../create-workshop"
        ><mat-icon>note_add</mat-icon>Create New Workshop</a
      >
    </div>
    @if (workshops$ | async; as workshops) {
    <div class="workshop-catalog__content">
      <div class="workshop-catalog__cards">
        @for (workshop of workshops; track workshop._id; let i =
        $index) {
        <ngx-workshop-card
          [workshop]="workshop"
          [order]="i"
          (deleteWorkshop)="deleteWorkshop($event)"
        />
        } @empty {
        <p>
          No workshops yet. Use Create New Workshop to add the first
          one.
        </p>
        }
      </div>
      <ngx-workshop-list-control
        class="workshop-catalog__sidebar"
        [workshops]="workshops"
      />
    </div>
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .workshop-catalog__toolbar {
        position: sticky;
        top: 56px;
        min-height: 56px;
        z-index: 5;
        display: flex;
        width: 100%;
        background: var(--mat-sys-primary);
        align-items: center;
        a {
          color: var(--mat-sys-on-primary);
          background: var(--mat-sys-primary);
          margin: 0 12px;
        }
      }
      .workshop-catalog__spacer {
        flex: 1;
      }
      .workshop-catalog__content {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 320px;
        gap: 24px;
        width: 100%;
        align-items: start;
      }
      .workshop-catalog__cards {
        display: flex;
        flex-wrap: wrap;
        gap: 24px;
        padding: 24px;
        justify-content: center;
        min-width: 0;
      }
      .workshop-catalog__sidebar {
        position: sticky;
        top: 112px;
        width: 320px;
      }
      @media (max-width: 900px) {
        .workshop-catalog__content {
          grid-template-columns: 1fr;
        }
        .workshop-catalog__sidebar {
          position: static;
          width: 100%;
        }
        .workshop-catalog__toolbar {
          flex-wrap: wrap;
        }
      }
    `,
  ],
})
export class WorkshopListComponent {
  private readonly dialogs = inject(MatDialog);
  readonly workshops$ = inject(NavigationService)
    .getWorkshops()
    .pipe(
      map((workshops) =>
        [...workshops].sort((a, b) => a.sortId - b.sortId)
      )
    );

  deleteWorkshop(workshop: WorkshopDto): void {
    this.dialogs.open(DeleteWorkshopModalComponent, {
      width: '400px',
      backdropClass: 'blur-backdrop',
      data: { workshop },
    });
  }
}
