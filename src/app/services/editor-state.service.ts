import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgxEditorJsBlock } from '@tmdjr/ngx-editor-js2';
import { catchError, concatMap, defer, EMPTY, finalize, Subject, tap } from 'rxjs';
import { WorkshopEditorService } from './workshops.service';

interface SaveCommand {
  id: string;
  html: string;
  revision: number;
}
export interface SaveNotice {
  id: string;
  success: boolean;
}

/** Saves survive routed-component destruction and are submitted in edit order. */
@Injectable({ providedIn: 'root' })
export class EditorStateService {
  private readonly editor = inject(WorkshopEditorService);
  private readonly commands = new Subject<SaveCommand>();
  private readonly notices = new Subject<SaveNotice>();
  private readonly latestRevision = new Map<string, number>();
  private readonly failed = signal<ReadonlyMap<string, SaveCommand>>(new Map());
  private revision = 0;
  private readonly pendingCount = signal(0);
  readonly pending = this.pendingCount.asReadonly();
  readonly notices$ = this.notices.asObservable();

  constructor() {
    this.commands
      .pipe(
        concatMap((command) =>
          defer(() => this.editor.savePageHTML(command.html, command.id)).pipe(
            tap(() => {
              if (this.latestRevision.get(command.id) === command.revision)
                this.clearFailure(command.id);
              this.notices.next({ id: command.id, success: true });
            }),
            catchError(() => {
              if (this.latestRevision.get(command.id) === command.revision) {
                this.failed.update((failed) => new Map(failed).set(command.id, command));
              }
              this.notices.next({ id: command.id, success: false });
              return EMPTY;
            }),
            finalize(() => this.pendingCount.update((count) => count - 1))
          )
        ),
        takeUntilDestroyed(inject(DestroyRef))
      )
      .subscribe();
  }

  save(id: string, blocks: NgxEditorJsBlock[]): void {
    const command = { id, html: JSON.stringify(blocks), revision: ++this.revision };
    this.latestRevision.set(id, command.revision);
    this.clearFailure(id);
    this.enqueue(command);
  }

  hasFailed(id: string): boolean {
    return this.failed().has(id);
  }

  retry(id: string): void {
    const command = this.failed().get(id);
    if (!command) return;
    this.clearFailure(id);
    this.enqueue(command);
  }

  private enqueue(command: SaveCommand): void {
    this.pendingCount.update((count) => count + 1);
    this.commands.next(command);
  }

  private clearFailure(id: string): void {
    this.failed.update((failed) => {
      const next = new Map(failed);
      next.delete(id);
      return next;
    });
  }
}
