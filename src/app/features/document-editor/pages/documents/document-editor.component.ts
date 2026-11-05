import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  NgxEditorJs2Component,
  NgxEditorJsBlock,
} from '@tmdjr/ngx-editor-js2';

@Component({
  host: { class: 'ngx-design-system ngx-document-design' },
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
  styles: [`
    :host { display: block; min-width: 0; }
    .document-editor { min-width: 0; max-width: 960px; margin-inline: auto; padding: 8px; background: var(--ngx-color-surface); }
    ngx-editor-js2 { display: block; min-width: 0; }
    .document-editor {
      --mat-sys-display-large: 600 1.5rem/1.35 var(--ngx-font-heading);
      --mat-sys-display-medium: 600 1.2rem/1.4 var(--ngx-font-heading);
      --mat-sys-display-small: 600 1.05rem/1.4 var(--ngx-font-heading);
      --mat-sys-body-large: 400 0.95rem/1.65 var(--ngx-font-body);
      --mat-sys-body-medium: 400 0.9rem/1.65 var(--ngx-font-body);
      --mat-sys-body-small: 400 0.8rem/1.6 var(--ngx-font-body);
    }
    :host ::ng-deep .document-editor ngx-editor-js2 h1 > span[contenteditable] { font: 600 1.5rem/1.35 var(--ngx-font-heading); }
    :host ::ng-deep .document-editor ngx-editor-js2 h2 > span[contenteditable] { font: 600 1.2rem/1.4 var(--ngx-font-heading); }
    :host ::ng-deep .document-editor ngx-editor-js2 h3 > span[contenteditable] { font: 600 1.05rem/1.4 var(--ngx-font-heading); }
    :host ::ng-deep .document-editor ngx-editor-js2 p[contenteditable] { font-size: 0.9rem; line-height: 1.65; }
  `],

})
export class DocumentEditorComponent {
  readonly blocks = input.required<NgxEditorJsBlock[]>();
  readonly blocksChanged = output<NgxEditorJsBlock[]>();
}
