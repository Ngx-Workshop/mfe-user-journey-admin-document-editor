import { Component, input } from '@angular/core';
import { WorkshopJourneyItem } from '../../../models/workshop-journey';

@Component({
  selector: 'ngx-external-page-placeholder',
  template: `
    <section
      class="external-page"
      aria-labelledby="external-page-title"
    >
      <p>
        {{
          entry().kind === 'ASSESSMENT_TEST'
            ? 'Assessment Test'
            : 'Coding Lab'
        }}
      </p>
      <h2 id="external-page-title">{{ entry().name }}</h2>
      <p class="external-page__greeting">Hello world</p>
      <p>
        This is a placeholder for the
        {{
          entry().kind === 'ASSESSMENT_TEST'
            ? 'assessment test'
            : 'coding lab'
        }}
        page.
      </p>
    </section>
  `,
  styles: [
    `
      .external-page {
        padding: 24px;
        border-radius: 16px;
        background: var(--mat-sys-surface-container);
      }
      .external-page__greeting {
        font-size: 1.5rem;
      }
    `,
  ],
})
export class ExternalPagePlaceholderComponent {
  readonly entry = input.required<WorkshopJourneyItem>();
}
