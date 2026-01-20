import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Pipe,
  PipeTransform,
  signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { map, tap } from 'rxjs';
import { NavigationService } from '../../services/navigation.service';
import { CreateWorkshopModalComponent } from '../workshops-sidepanel/workshop-list-controls/modals/create-category-modal/create-workshop-modal.component';
import { WorkshopListControlsComponent } from '../workshops-sidepanel/workshop-list-controls/workshop-list-control.component';

@Pipe({ name: 'optimizeCloudinaryUrl' })
export class OptimizeCloudinaryUrlPipe implements PipeTransform {
  transform(url: string): string {
    const parts = url.split('/upload/');
    return `${parts[0]}/upload/w_650,q_auto:best,f_auto/${parts[1]}`;
  }
}

@Component({
  selector: 'ngx-workshop-list',
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIcon,
    NgOptimizedImage,
    OptimizeCloudinaryUrlPipe,
    MatButton,
    WorkshopListControlsComponent,
  ],
  template: `
    <div class="action-bar">
      <a routerLink="../../" matButton="filled">
        <mat-icon>arrow_back</mat-icon> Back to Sections</a
      >
      <div class="flex-spacer"></div>
      <button matButton="filled" (click)="createWorkshop()">
        <mat-icon>note_add</mat-icon>
        Create New Workshop
      </button>
    </div>
    @if (workshops | async; as ws) {
    <div class="workshop-list-content">
      <div
        class="workshop-list"
        [class.animate]="animationTriggered()"
      >
        @for (workshop of ws; track workshop.workshopDocumentGroupId;
        let i = $index) {
        <div
          class="ngx-mat-card mat-elevation-z6"
          [style.--animation-order]="i"
          [routerLink]="
            '../' +
            workshop.workshopDocumentGroupId +
            '/' +
            workshop.workshopDocuments[0]._id
          "
        >
          <div class="img-wrapper">
            <img
              [ngSrc]="workshop.thumbnail | optimizeCloudinaryUrl"
              priority
              fill
            />
          </div>
          <h2>{{ workshop.name }}</h2>
          <p>{{ workshop.summary }}</p>
        </div>
        }
      </div>
      <ngx-workshop-list-control
        class="workshop-list-sidepanel"
        [workshops]="ws"
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

        .image-uploader-cta {
          position: absolute;
          top: 10px;
          left: 10px;
        }

        .workshop-list {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          padding: 24px;
          justify-content: center;
        }
      }

      .back-cta {
        align-self: flex-start;
        margin: 16px 24px 0 24px;
      }

      .ngx-mat-card {
        width: 325px;
        height: 375px;
        overflow: auto;
        cursor: pointer;
        border-radius: 16px;
        color: var(--mat-sys-on-secondary-container);
        background-color: var(--mat-sys-secondary-container);

        /* Initial state for animation */
        opacity: 0;
        margin-top: 100px;
        clip-path: circle(0% at 85% 85%);

        .animate & {
          animation: circleReveal 0.6s ease-in-out forwards;
          animation-delay: calc(var(--animation-order, 0) * 150ms);
        }

        .img-wrapper {
          position: relative;
          width: 100%;
          height: 50%;
          img {
            object-fit: contain;
          }
        }

        h2 {
          font-weight: 100;
          font-stretch: condensed;
          font-size: 1.6rem;
          padding: 12px 8px;
          margin: 0;
        }

        p {
          font-size: 1rem;
          font-weight: 100;
          padding: 0px 8px;
          margin: 0 0 24px;
        }
      }

      @keyframes circleReveal {
        0% {
          opacity: 0;
          margin-top: 15px;
          clip-path: circle(0% at 85% 85%);
        }
        100% {
          opacity: 1;
          margin-top: 0;
          clip-path: circle(200% at 0% 0%);
        }
      }

      .workshop-list-content {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 320px;
        column-gap: 24px;
        align-items: start;
      }

      .page {
        min-width: 0;
      }
      .workshop-list-sidepanel {
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
        mat-paginator {
          color: var(--mat-sys-on-primary);
          background: var(--mat-sys-primary);
          margin: 0 12px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkshopListComponent {
  animationTriggered = signal(false);
  private matDialog = inject(MatDialog);

  workshops = inject(NavigationService)
    .getWorkshops()
    .pipe(
      map((workshops) =>
        workshops.sort((a, b) => a.sortId - b.sortId)
      ),
      tap(() => {
        window.document.body.scrollTo(0, 0);
        // Trigger animation after data loads
        this.animationTriggered.set(true);
      })
    );

  createWorkshop() {
    this.matDialog.open(CreateWorkshopModalComponent, {
      width: '400px',
      backdropClass: 'blur-backdrop',
    });
  }
}
