import { Component, computed, input } from '@angular/core';

type InstructionBlock = {
  kind: 'heading' | 'text' | 'code' | 'list';
  text: string;
  items: string[];
};

/** Small text-only Markdown block renderer. Author HTML is never executed. */
export function instructionBlocks(
  source: string
): InstructionBlock[] {
  const blocks: InstructionBlock[] = [];
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  for (let i = 0; i < lines.length; ) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (/^\s*```/.test(line)) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i]))
        code.push(lines[i++]);
      if (i < lines.length) i++;
      blocks.push({ kind: 'code', text: code.join('\n'), items: [] });
    } else if (/^#{1,6}\s/.test(line)) {
      blocks.push({
        kind: 'heading',
        text: line.replace(/^#{1,6}\s+/, ''),
        items: [],
      });
      i++;
    } else if (/^\s*([-*+]\s|\d+\.\s)/.test(line)) {
      const items: string[] = [];
      while (
        i < lines.length &&
        /^\s*([-*+]\s|\d+\.\s)/.test(lines[i])
      )
        items.push(lines[i++].replace(/^\s*([-*+]\s|\d+\.\s)/, ''));
      blocks.push({ kind: 'list', text: '', items });
    } else {
      const text: string[] = [line];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^\s*(```|#{1,6}\s|[-*+]\s|\d+\.\s)/.test(lines[i])
      )
        text.push(lines[i++]);
      blocks.push({ kind: 'text', text: text.join('\n'), items: [] });
    }
  }
  return blocks;
}

@Component({
  selector: 'ngx-lab-instructions',
  template: `
    <div class="lab-instructions">
      @for (block of blocks(); track $index) { @switch (block.kind) {
      @case ('heading') {
      <h3>{{ block.text }}</h3>
      } @case ('code') {
      <pre><code>{{ block.text }}</code></pre>
      } @case ('list') {
      <ul>
        @for (item of block.items; track $index) {
        <li>{{ item }}</li>
        }
      </ul>
      } @default {
      <p>{{ block.text }}</p>
      } } }
    </div>
  `,
  styles: [
    `
      .lab-instructions {
        overflow-wrap: anywhere;
      }
      .lab-instructions p {
        white-space: pre-wrap;
        line-height: 1.6;
      }
      .lab-instructions pre {
        overflow: auto;
        padding: 16px;
        border-radius: 8px;
        background: var(--mat-sys-surface-container-high);
      }
      .lab-instructions li {
        margin: 8px 0;
      }
    `,
  ],
})
export class LabInstructionsComponent {
  readonly markdown = input.required<string>();
  readonly blocks = computed(() =>
    instructionBlocks(this.markdown())
  );
}
