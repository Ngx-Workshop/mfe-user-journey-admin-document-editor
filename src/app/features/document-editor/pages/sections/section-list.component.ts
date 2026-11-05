import { NgxActionBar } from '@tmdjr/ngx-workshop-design-system';
import { DocumentPanelComponent } from '../../components/document-panel.component';
import { DocumentViewportDirective } from '../../components/document-viewport.directive';
import { ChangeDetectionStrategy } from '@angular/core';
import { NgxButton } from '@tmdjr/ngx-workshop-design-system';
import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SectionDto } from '@tmdjr/document-contracts';
import { NavigationService } from '../../state/navigation.service';
import {
  DeleteSectionDialogData,
  DeleteSectionModalComponent,
} from './delete-section-modal.component';
import { SectionCardComponent } from './section-card.component';

@Component({
  host: { class: 'ngx-design-system ngx-document-design' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ngx-setion-list',
  imports: [NgxActionBar, DocumentPanelComponent, DocumentViewportDirective,NgxButton,
    AsyncPipe,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    SectionCardComponent,
  ],
  template: `
    <ngx-action-bar heading="Document editor"><a mat-flat-button ngxButton surface="outline" shape="chevron" routerLink="create-section"><mat-icon>add</mat-icon>Create Section</a></ngx-action-bar>
    <main class="document-layout"><div class="document-layout__workspace" ngxDocumentViewport><ngx-document-panel heading="Sections" eyebrow="DOCUMENTS / CATALOGUE" background="grid">
      @for (section of sections$ | async; track section._id) {
        <ngx-section-card
          [section]="section"
          (deleteSection)="deleteSection($event)"
        />
      } @empty {
        <p>
          No sections yet. Create a section to start organizing
          workshops.
        </p>
      }
    </ngx-document-panel></div></main>
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

  `],

})
export class SectionListComponent {
  readonly sections$ = inject(NavigationService).getSections();
  private readonly dialogs = inject(MatDialog);

  deleteSection(section: SectionDto): void {
    this.dialogs.open<
      DeleteSectionModalComponent,
      DeleteSectionDialogData,
      boolean
    >(DeleteSectionModalComponent, {
      width: '400px',
      maxWidth: 'calc(100vw - 32px)',
      ariaModal: true,
      backdropClass: 'blur-backdrop',
      panelClass: 'ngx-design-system-overlay',
      data: { section },
    });
  }
}
