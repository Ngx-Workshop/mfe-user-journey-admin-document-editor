import { afterNextRender, afterRenderEffect, ChangeDetectionStrategy, Component, DestroyRef,
  ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { NgxPanel, NgxPanelShape, NgxPanelBackground, NgxPanelTone } from '@tmdjr/ngx-workshop-design-system';
import { observePanelBody } from '../utils/panel-body-viewport';
@Component({
  host: { class: 'ngx-design-system ngx-document-design' },
  selector: 'ngx-document-panel', imports: [NgxPanel], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ngx-panel [heading]="heading()" [eyebrow]="eyebrow()" [shape]="shape()" [background]="background()" [tone]="tone()">
      <div ngxPanelHeader class="document-panel__tools"><ng-content select="[documentPanelHeader]" /></div>
      <section #body class="document-panel__body" [style.height.px]="bodyHeight()" tabindex="0"
        role="region" [attr.aria-label]="heading()"><ng-content /></section>
    </ngx-panel>
  `,
  styles: [`
    :host { display: block; min-height: 0; min-width: 0; height: 100%; }
    ngx-panel { height: auto; --ngx-space-4: 0.5rem; }
    // Compact the public Material card elements used by NgxPanel on narrow screens.
    @media (max-width: 600px) {
      :host ::ng-deep ngx-panel mat-card-header { padding: 4px 12px 0; margin: 0 0 8px; gap: 4px; }
      :host ::ng-deep ngx-panel mat-card-title { font-size: 0.9rem; margin-top: 2px; line-height: 1.3; }
      :host ::ng-deep ngx-panel mat-card-subtitle { font-size: 8px; }
      :host ::ng-deep ngx-panel mat-card-content { padding: 0 12px; }
      :host ::ng-deep ngx-panel mat-card-actions { padding: 4px; min-height: 0; }
    }
    .document-panel__tools { display: flex; gap: 0.5rem; align-items: center; font: var(--ngx-font-label); font-size: 0.7rem; }
    .document-panel__body { position: relative; min-height: 0; overflow: auto; scrollbar-width: thin; box-sizing: border-box; padding: 4px 2px; }
    .document-panel__body:focus-visible { outline: 2px solid var(--ngx-color-primary); outline-offset: -2px; }
  `],
})
export class DocumentPanelComponent {
  readonly heading = input.required<string>(); readonly eyebrow = input.required<string>();
  readonly shape = input<NgxPanelShape>('stepped'); readonly background = input<NgxPanelBackground>('solid');
  readonly tone = input<NgxPanelTone>('primary'); readonly resetKey = input<unknown>(null); readonly bodyHeight = signal(0);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body'); private readonly destroyRef = inject(DestroyRef);
  constructor() {
    afterRenderEffect(() => { this.resetKey(); this.body().nativeElement.scrollTop = 0; });
    afterNextRender(() => this.destroyRef.onDestroy(observePanelBody(this.host.nativeElement,
      this.body().nativeElement, height => this.bodyHeight.set(height ?? 0), 'container')));
  }
}
