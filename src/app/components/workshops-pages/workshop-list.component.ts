import {
  animate,
  keyframes,
  query,
  stagger,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Pipe,
  PipeTransform,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { map, tap } from 'rxjs';
import { NavigationService } from '../../services/navigation.service';
import { WorkshopListControlsComponent } from '../workshops-sidepanel/workshop-list-controls/workshop-list-control.component';

@Pipe({ name: 'optimizeCloudinaryUrl', standalone: true })
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
  animations: [
    trigger('staggerCircleReveal', [
      transition(':enter', [
        query(
          '.ngx-mat-card',
          [
            style({ opacity: 0, marginTop: '100px' }),
            stagger('150ms', [
              animate(
                '0.6s ease-in-out',
                keyframes([
                  style({
                    opacity: 0,
                    marginTop: '15px',
                    clipPath: 'circle(0% at 85% 85%)',
                    offset: 0,
                  }),
                  style({
                    opacity: 1,
                    marginTop: '0',
                    clipPath: 'circle(200% at 0% 0%)',
                    offset: 1.0,
                  }),
                ])
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
      transition(':leave', [animate(600, style({ opacity: 0 }))]),
    ]),
  ],
  template: `
    <div class="action-bar">
      <a routerLink="../../" matButton="filled">
        <mat-icon>arrow_back</mat-icon> Back to Sections</a
      >
    </div>
    @if(workshops | async; as ws) {
    <div class="workshop-list-content">
      <div class="workshop-list" [@staggerCircleReveal]>
        @for(workshop of ws; track $index) {
        <div
          class="ngx-mat-card mat-elevation-z6"
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
      ></ngx-workshop-list-control>
    </div>
    }
  `,
  styles: [
    `
      @use '@angular/material' as mat;
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
  workshops = inject(NavigationService)
    .getWorkshops()
    .pipe(
      map((workshops) =>
        workshops.sort((a, b) => a.sortId - b.sortId)
      ),
      tap(() => window.document.body.scrollTo(0, 0))
    );
}
