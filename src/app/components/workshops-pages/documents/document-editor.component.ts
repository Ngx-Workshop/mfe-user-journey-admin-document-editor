import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgxEditorJs2Component, NgxEditorJsBlock } from '@tmdjr/ngx-editor-js2';

@Component({
  selector: 'ngx-document-editor',
  imports: [NgxEditorJs2Component],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="document-editor">
      <ngx-editor-js2
        [blocks]="blocks()"
        [requestBlocks]="null"
        (formChanged)="blocksChanged.emit($event)"
      />
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        justify-content: space-around;
        margin-top: 24px;
        min-width: 0;
      }
      .document-editor {
        background: var(--mat-sys-surface-container-low);
        padding: 1.5rem;
        border-radius: var(--mat-sys-corner-medium);
        margin-bottom: 2rem;
        max-width: 750px;
        min-width: 0;
      }
    `,
  ],
})
export class DocumentEditorComponent {
  readonly blocks = input.required<NgxEditorJsBlock[]>();
  readonly blocksChanged = output<NgxEditorJsBlock[]>();
}
