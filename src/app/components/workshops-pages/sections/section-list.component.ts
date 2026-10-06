import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SectionDto } from '@tmdjr/document-contracts';
import { NavigationService } from '../../../services/navigation.service';
import {
  DeleteSectionDialogData,
  DeleteSectionModalComponent,
} from './delete-section-modal.component';
import { SectionCardComponent } from './section-card.component';

@Component({
  selector: 'ngx-setion-list',
  imports: [
    AsyncPipe,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    SectionCardComponent,
  ],
  template: `
    <header class="section-catalog__header">
      <div class="section-catalog__headline">
        <h1 class="section-catalog__title">Document-Editor</h1>
        <h2 class="section-catalog__subtitle">
          Build Workshops for Angular, RxJS, and NestJs
        </h2>
        <a matButton="elevated" routerLink="create-section"
          ><mat-icon>add</mat-icon>Create Section</a
        >
      </div>
    </header>
    <main class="section-catalog__content">
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
    </main>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        color: var(--mat-sys-on-primary-container);
      }
      .section-catalog__header {
        overflow: hidden;
        position: relative;
        height: 420px;
        background: var(--mat-sys-primary);
      }
      .section-catalog__header::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="%23e3e3e3"><g><rect fill="none" height="24" width="24" x="0"/></g><g><g><polygon points="20,7 20.94,4.94 23,4 20.94,3.06 20,1 19.06,3.06 17,4 19.06,4.94"/><polygon points="8.5,7 9.44,4.94 11.5,4 9.44,3.06 8.5,1 7.56,3.06 5.5,4 7.56,4.94"/><polygon points="20,12.5 19.06,14.56 17,15.5 19.06,16.44 20,18.5 20.94,16.44 23,15.5 20.94,14.56"/><path d="M17.71,9.12l-2.83-2.83C14.68,6.1,14.43,6,14.17,6c-0.26,0-0.51,0.1-0.71,0.29L2.29,17.46c-0.39,0.39-0.39,1.02,0,1.41 l2.83,2.83C5.32,21.9,5.57,22,5.83,22s0.51-0.1,0.71-0.29l11.17-11.17C18.1,10.15,18.1,9.51,17.71,9.12z M14.17,8.42l1.41,1.41 L14.41,11L13,9.59L14.17,8.42z M5.83,19.59l-1.41-1.41L11.59,11L13,12.41L5.83,19.59z"/></g></g></svg>');
        background-size: 400px;
        background-repeat: no-repeat;
        background-position: 80% 20px;
        opacity: 0.4;
      }
      .section-catalog__headline {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        text-align: center;
        position: relative;
        color: var(--mat-sys-secondary-container);
      }
      .section-catalog__title {
        font-size: clamp(3rem, 8vw, 7rem);
        font-weight: bold;
        line-height: 1;
        margin: 15px 5px;
      }
      .section-catalog__subtitle {
        font-size: 1.4rem;
        font-weight: 100;
        line-height: 28px;
        margin: 15px 0 25px;
      }
      .section-catalog__content {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: flex-start;
        padding: 16px;
        width: min(75%, 1080px);
        margin: 20px auto;
        gap: 15px;
      }
      @media (max-width: 600px) {
        .section-catalog__content {
          width: auto;
          margin: 20px 0;
        }
      }
    `,
  ],
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
      data: { section },
    });
  }
}
