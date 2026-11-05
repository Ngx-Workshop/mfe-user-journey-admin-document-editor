import { afterNextRender, DestroyRef, Directive, ElementRef, inject, signal } from '@angular/core';
import { observeWorkspaceHeight } from '../utils/panel-body-viewport';

/** Fits a journey workspace below the shell toolbar, with panel-owned scrolling. */
@Directive({ selector: '[ngxDocumentViewport]', host: { '[style.height.px]': 'height()' } })
export class DocumentViewportDirective {
  readonly height = signal(0);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  constructor() {
    afterNextRender(() => this.destroyRef.onDestroy(observeWorkspaceHeight(
      this.host.nativeElement, height => this.height.set(height))));
  }
}
