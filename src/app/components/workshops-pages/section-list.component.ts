import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SectionDto } from '@tmdjr/document-contracts';
import { NavigationService } from '../../services/navigation.service';
import {
  IsDeviconPipe,
  MenuDeviconComponent,
} from '../devicon.component';
import { DeleteSectionDialogData, DeleteSectionModalComponent } from './modals/delete-section-modal.component';

@Component({
  selector: 'ngx-setion-list',
  imports: [
    AsyncPipe,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    IsDeviconPipe,
    MenuDeviconComponent,
  ],
  template: `
    <header class="header-background">
      <div class="header-section">
        <div class="header-headline">
          <h1>Document-Editor</h1>
          <h2>Build Workshops for Angular, RxJS, and NestJs</h2>
        </div>
        <div class="header-start">
          <a matButton="elevated" routerLink="create-section">
            <mat-icon>add</mat-icon>Create Section
          </a>
        </div>
      </div>
    </header>
    <main class="home-promo">
      <div class="home-row home-promo-section">
        @for (section of sections$ | async; track section._id) {
        <article class="section-card">
          <a
            class="home-row-column"
            [routerLink]="[section._id, 'workshop-list']"
          >
            @if (section.headerSvgPath) { @if (section.headerSvgPath |
            isDevicon) {
            <ngx-menu-devicon
              class="section-image-icon"
              [icon]="section.headerSvgPath"
              [large]="true"
              aria-hidden="true"
              style="--devicon-size: 64px"
            />
            } @else {
            <img
              class="section-image-icon"
              [src]="section.headerSvgPath"
              alt=""
              aria-hidden="true"
            />
            } } @else {
            <mat-icon
              aria-hidden="true"
              class="section-image-icon-default"
              >image</mat-icon
            >
            }
            <h2>{{ section.sectionTitle }}</h2>
            <p>
              {{ section.sectionDescription }}
            </p>
          </a>
          <div class="section-card-actions">
            <a
              matIconButton
              [routerLink]="['edit-section', section._id]"
              [attr.aria-label]="'Edit ' + section.sectionTitle"
              [title]="'Edit ' + section.sectionTitle"
            >
              <mat-icon>edit</mat-icon>
            </a>
            <button
              matIconButton
              type="button"
              [attr.aria-label]="'Delete ' + section.sectionTitle"
              [title]="'Delete ' + section.sectionTitle"
              (click)="deleteSection(section)"
            >
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </article>
        } @empty {
        <p>
          No sections yet. Create a section to start organizing
          workshops.
        </p>
        }
      </div>
    </main>
  `,
  styles: [
    `
      .section-card {
        position: relative;
      }

      .section-card-actions {
        position: absolute;
        top: 8px;
        right: 8px;
        display: flex;
        color: var(--mat-sys-primary);
        background: var(--mat-sys-surface-container);
        border-radius: var(--mat-sys-corner-full);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.15s;
      }

      .section-card:is(:hover, :focus-within) .section-card-actions {
        opacity: 1;
        pointer-events: auto;
      }

      @media (hover: none) {
        .section-card-actions {
          opacity: 1;
          pointer-events: auto;
        }
      }

      :host {
        display: flex;
        flex-direction: column;

        color: var(--mat-sys-on-primary-container);

        .home-row-column {
          color: var(--mat-sys-on-primary-container);
        }

        .header-background {
          background-color: var(--mat-sys-primary);
        }

        .header-headline {
          color: var(--mat-sys-secondary-container);
        }

        .header-start {
          color: var(--mat-sys-primary-container);
        }

        .home-row {
          color: var(--mat-sys-primary-container);
        }

        .home-promo-section {
          h2 {
            font-size: 2.5rem;
            font-weight: 300;
            margin: 0;
          }
          p {
            font-weight: 300;
            font-size: 1.3rem;
            line-height: 2rem;
            margin: 0;
          }
        }

        .header-background {
          overflow: hidden;
          position: relative;
          height: 420px;
        }

        .header-background::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="%23e3e3e3"><g><rect fill="none" height="24" width="24" x="0"/></g><g><g><polygon points="20,7 20.94,4.94 23,4 20.94,3.06 20,1 19.06,3.06 17,4 19.06,4.94"/><polygon points="8.5,7 9.44,4.94 11.5,4 9.44,3.06 8.5,1 7.56,3.06 5.5,4 7.56,4.94"/><polygon points="20,12.5 19.06,14.56 17,15.5 19.06,16.44 20,18.5 20.94,16.44 23,15.5 20.94,14.56"/><path d="M17.71,9.12l-2.83-2.83C14.68,6.1,14.43,6,14.17,6c-0.26,0-0.51,0.1-0.71,0.29L2.29,17.46c-0.39,0.39-0.39,1.02,0,1.41 l2.83,2.83C5.32,21.9,5.57,22,5.83,22s0.51-0.1,0.71-0.29l11.17-11.17C18.1,10.15,18.1,9.51,17.71,9.12z M14.17,8.42l1.41,1.41 L14.41,11L13,9.59L14.17,8.42z M5.83,19.59l-1.41-1.41L11.59,11L13,12.41L5.83,19.59z"/></g></g></svg>');
          background-size: 400px;
          background-repeat: no-repeat;
          background-position: 80% 20px;
          opacity: 0.4;
        }

        .header-section {
          display: flex;
          justify-content: center;
          flex-direction: column;
          align-items: center;
          height: 100%;
          text-align: center;
          position: relative;
        }

        .header-headline {
          h1 {
            font-size: 7rem;
            font-weight: bold;
            line-height: 5.6rem;
            margin: 15px 5px;
          }

          h2 {
            font-size: 1.4rem;
            font-weight: 100;
            line-height: 28px;
            margin: 15px 0 25px 0;
          }
        }

        .header-start {
          text-align: center;
          margin: 15px 0 0 0;
          .mat-mdc-raised-button {
            font-size: 15px;
          }
        }

        .home-promo {
          align-items: center;
          display: flex;
          flex-direction: column;
          padding: 16px;
          width: 75%;
          max-width: 1080px;
          margin: auto;

          .home-row-column {
            text-decoration: none;

            h2 {
              font-size: 2rem;
              font-weight: 400;
              margin: 0 0 8px;
            }

            p {
              font-size: 1.3rem;
              font-weight: 300;
              line-height: 1.75rem;
              margin: 0 0 24px 0;
            }
          }
        }

        .home-row {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          justify-content: center;
          margin: 20px 0;
          gap: 15px;
          align-items: flex-start;
        }

        .home-row-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          max-width: 350px;
          height: fit-content;
          border-radius: 24px;
          transition: box-shadow 0.4s;
          box-shadow: var(--mat-sys-level3);
          background-color: var(--mat-sys-secondary-container);

          mat-icon {
            width: 200px;
            height: 200px;
            vertical-align: middle;
            margin-bottom: 8px;
          }

          .section-image-icon {
            width: 160px;
            height: 160px;
            object-fit: contain;
            padding: 20px;
          }

          .section-image-icon-default {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 350px;
            height: 200px;
            font-size: 4rem;
            color: var(--mat-sys-primary-fixed);
            background-color: var(--mat-sys-primary-fixed-dim);
            border-top-left-radius: 24px;
            border-top-right-radius: 24px;
          }

          &:hover {
            cursor: pointer;
            box-shadow: var(--mat-sys-level5);
          }

          p {
            padding: 0 19px;
            font-size: 1.2rem;
          }
        }

        @media (max-width: 1024px) {
          .home-row {
            flex-direction: column;
          }

          .home-row-column--angular-section {
            order: -1;
          }

          .header-headline {
            h1 {
              font-size: 6rem;
              font-weight: bold;
              line-height: 5.6rem;
              margin: 15px 5px;
            }

            h2 {
              font-size: 1.4rem;
              font-weight: 100;
              line-height: 28px;
              margin: 15px 0 25px 0;
            }
          }
        }
      }
    `,
  ],
})
export class SectionListComponent {
  readonly sections$ = inject(NavigationService).getSections();

  private readonly dialogs = inject(MatDialog);

  sectionDescription(id: string): string {
    const descriptions: Record<string, string> = {
      angular:
        'Angular is a framework and a development platform for creating single-page apps.',
      nestjs:
        'A progressive Node.js framework for building efficient, reliable and scalable server-side applications.',
      rxjs: 'RxJS is a library for reactive programming, to help compose asynchronous or callback code.',
    };
    return (
      descriptions[id] ??
      'Create and manage workshops in this section.'
    );
  }

  protected readonly router = inject(Router);
  protected readonly route = inject(ActivatedRoute);

  navigateToSection(section: string): void {
    this.router.navigate([`../${section}`], {
      relativeTo: this.route,
    });
  }

  deleteSection(section: SectionDto): void {
    this.dialogs.open<DeleteSectionModalComponent, DeleteSectionDialogData, boolean>(DeleteSectionModalComponent, {
      width: '400px',
      maxWidth: 'calc(100vw - 32px)',
      ariaModal: true,
      backdropClass: 'blur-backdrop',
      data: { section },
    });
  }
}
