import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Pipe,
  PipeTransform,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { map, tap } from 'rxjs';
import { WorkshopDto } from '@tmdjr/document-contracts';
import { NavigationService } from '../../services/navigation.service';
import { IsDeviconPipe, MenuDeviconComponent } from '../devicon.component';
import { WorkshopListControlsComponent } from '../workshops-sidepanel/workshop-list-controls/workshop-list-control.component';
import { DeleteWorkshopModalComponent } from '../workshops-sidepanel/workshop-list-controls/modals/delete-category-modal/delete-workshop-modal.component';

@Pipe({ name: 'optimizeCloudinaryUrl' })
export class OptimizeCloudinaryUrlPipe implements PipeTransform {
  transform(url: string): string {
    if (!/^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(url)) {
      return url;
    }
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
    MatButtonModule,
    WorkshopListControlsComponent,
    IsDeviconPipe,
    MenuDeviconComponent,
  ],
  template: `
    <div class="action-bar">
      <a routerLink="../../" matButton="filled">
        <mat-icon>arrow_back</mat-icon> Back to Sections</a
      >
      <div class="flex-spacer"></div>
      <a matButton="filled" routerLink="../create-workshop">
        <mat-icon>note_add</mat-icon>
        Create New Workshop
      </a>
    </div>
    @if (workshops | async; as ws) {
    <div class="workshop-list-content">
      <div
        class="workshop-list"
        [class.animate]="animationTriggered()"
      >
        @for ( workshop of ws; track workshop.workshopDocumentGroupId;
        let i = $index ) {
        <article
          class="ngx-mat-card mat-elevation-z6"
          [style.--animation-order]="i"
        >
          <a
            class="workshop-link"
            [routerLink]="
              '../' +
              workshop.workshopDocumentGroupId +
              '/' +
              workshop.workshopDocuments[0]._id
            "
          >
          <div class="img-wrapper">
            @if (workshop.thumbnail) {
            @if (workshop.thumbnail | isDevicon) {
            <div class="devicon-thumbnail">
              <ngx-menu-devicon
                [icon]="workshop.thumbnail"
                [large]="true"
                aria-hidden="true"
                style="--devicon-size: 96px"
              />
            </div>
            } @else {
            <img
              [ngSrc]="workshop.thumbnail | optimizeCloudinaryUrl"
              [alt]="workshop.name"
              priority
              fill
            />
            } } @else {
            <mat-icon aria-hidden="true">image</mat-icon>
            }
          </div>
          <h2>{{ workshop.name }}</h2>
          <p>{{ workshop.summary }}</p>
          </a>
          <div class="workshop-card-actions">
            <a
              matIconButton
              class="edit-icon"
              [routerLink]="['../edit-workshop', workshop._id]"
              [attr.aria-label]="'Edit ' + workshop.name"
              [title]="'Edit ' + workshop.name"
            ><mat-icon>edit</mat-icon></a>
            <button
              matIconButton
              type="button"
              class="delete-icon"
              [attr.aria-label]="'Delete ' + workshop.name"
              [title]="'Delete ' + workshop.name"
              (click)="deleteWorkshop(workshop)"
            ><mat-icon>delete</mat-icon></button>
          </div>
        </article>
        } @empty {
        <p>
          No workshops yet. Use Create New Workshop to add the first
          one.
        </p>
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
          width: 100%;
        }
      }

      .back-cta {
        align-self: flex-start;
        margin: 16px 24px 0 24px;
      }

      .ngx-mat-card {
        position: relative;
        width: 325px;
        height: 375px;
        overflow: hidden;
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

        .workshop-link {
          display: block;
          height: 100%;
          overflow: auto;
          color: inherit;
          text-decoration: none;
        }

        .workshop-card-actions {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          border-radius: var(--mat-sys-corner-full);
          background: var(--mat-sys-secondary-container);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s;
        }

        &:is(:hover, :focus-within) .workshop-card-actions {
          opacity: 1;
          pointer-events: auto;
        }

        @media (hover: none) {
          .workshop-card-actions {
            opacity: 1;
            pointer-events: auto;
          }
        }

        .img-wrapper {
          position: relative;
          width: 100%;
          height: 50%;
          .devicon-thumbnail {
            height: 100%;
            display: grid;
            place-items: center;
          }
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
        width: 100%;
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
  private readonly dialogs = inject(MatDialog);
  animationTriggered = signal(false);

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

  deleteWorkshop(workshop: WorkshopDto): void {
    this.dialogs.open(DeleteWorkshopModalComponent, {
      width: '400px',
      backdropClass: 'blur-backdrop',
      data: { workshop },
    });
  }
}
