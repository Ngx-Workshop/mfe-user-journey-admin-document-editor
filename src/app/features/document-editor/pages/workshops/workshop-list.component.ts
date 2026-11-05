import { NgxActionBar } from '@tmdjr/ngx-workshop-design-system';
import { DocumentPanelComponent } from '../../components/document-panel.component';
import { DocumentViewportDirective } from '../../components/document-viewport.directive';
import { signal } from '@angular/core';
import { NgxButton } from '@tmdjr/ngx-workshop-design-system';
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
import { NavigationService } from '../../state/navigation.service';
import { DeleteWorkshopModalComponent } from '../../components/workshops-sidepanel/workshop-list-controls/delete-workshop-modal.component';
import { WorkshopListControlsComponent } from '../../components/workshops-sidepanel/workshop-list-controls/workshop-list-control.component';
import { WorkshopCardComponent } from './workshop-card.component';
export { OptimizeCloudinaryUrlPipe } from './optimize-cloudinary-url.pipe';

@Component({
  host: { class: 'ngx-design-system ngx-document-design' },
  selector: 'ngx-workshop-list',
  imports: [NgxActionBar, DocumentPanelComponent, DocumentViewportDirective,NgxButton,
    AsyncPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    WorkshopListControlsComponent,
    WorkshopCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ngx-action-bar heading="Workshops"><a routerLink="../../" mat-flat-button ngxButton surface="outline"><mat-icon>arrow_back</mat-icon>Back to Sections</a><a mat-flat-button ngxButton surface="outline" routerLink="../create-workshop"><mat-icon>note_add</mat-icon>Create New Workshop</a></ngx-action-bar>
    @if (workshops$ | async; as workshops) {
      <main class="document-layout"><div class="document-layout__workspace workshop-catalog__content" ngxDocumentViewport>
        <div class="workshop-catalog__switch" role="group" aria-label="Workshop panels"><button mat-button [attr.aria-pressed]="pane() === 'workshops'" (click)="pane.set('workshops')">Workshops</button><button mat-button [attr.aria-pressed]="pane() === 'order'" (click)="pane.set('order')">Order</button></div>
        <ngx-document-panel heading="Workshops" eyebrow="DOCUMENTS / CATALOGUE" background="grid" [class.workshop-catalog__hidden]="pane() !== 'workshops'">
        <div class="workshop-catalog__cards">
          @for (
            workshop of workshops;
            track workshop._id;
            let i = $index
          ) {
            <ngx-workshop-card
              [workshop]="workshop"
              [order]="i"
              (deleteWorkshop)="deleteWorkshop($event)"
            />
          } @empty {
            <p>
              No workshops yet. Use Create New Workshop to add the
              first one.
            </p>
          }
        </div>
        </ngx-document-panel>
        <ngx-document-panel heading="Workshop order" eyebrow="DOCUMENTS / NAVIGATION" shape="chamfered" [class.workshop-catalog__hidden]="pane() !== 'order'">
        <ngx-workshop-list-control
          class="workshop-catalog__sidebar"
          [workshops]="workshops"
        />
        </ngx-document-panel>
      </div></main>
    }
  `,
  styles: [`
    :host { display: block; min-width: 0; color: var(--ngx-color-text); background: var(--ngx-color-canvas); }
    ngx-action-bar { --ngx-action-bar-top: 96px; }
    .document-layout { padding: 1rem; }
    .document-layout__workspace { min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); gap: 1rem; }
    @media (max-width: 720px) {
      ngx-action-bar { --ngx-action-bar-top: 76px; gap: 4px; }
      ngx-action-bar a, ngx-action-bar button { min-width: 0; padding-inline: 8px; font-size: 0.7rem; }
      .document-layout { padding: 0.5rem; }
    }
    .workshop-catalog__content { grid-template-columns: minmax(0, 1fr) 320px; }
    .workshop-catalog__cards { display: grid; grid-template-columns: minmax(0, 1fr); }
    .workshop-catalog__switch { display: none; }
    @media (max-width: 1000px) {
      .workshop-catalog__content { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); gap: 8px; }
      .workshop-catalog__switch { display: flex; }
      .workshop-catalog__switch button[aria-pressed='true'] { background: var(--ngx-color-surface-high); }
      ngx-document-panel { grid-column: 1; grid-row: 2; }
      .workshop-catalog__hidden { display: none; }
    }

  `],

})
export class WorkshopListComponent {
  readonly pane = signal<'workshops' | 'order'>('workshops');
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
      panelClass: 'ngx-design-system-overlay',
      data: { workshop },
    });
  }
}
