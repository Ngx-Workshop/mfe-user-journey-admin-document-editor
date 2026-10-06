import { WorkshopDto, WorkshopPageDto } from '@tmdjr/document-contracts';
import { ResolvedWorkshopEntry, WorkshopJourneyItem } from '../models/workshop-journey';
import { NgxEditorJsBlock } from '@tmdjr/ngx-editor-js2';

/** Parse only when resolved document content changes, not on sidebar state updates. */
export function documentContent(document: WorkshopPageDto) {
  let blocks: NgxEditorJsBlock[] = [];
  let error = '';
  try {
    const parsed: unknown = JSON.parse(document.html);
    if (!Array.isArray(parsed)) throw new Error('Invalid blocks');
    blocks = parsed;
  } catch {
    error =
      'The saved page content could not be read. Reload the page or repair its stored content.';
  }
  return { document, blocks, error };
}

export function documentViewModel(
  document: WorkshopPageDto,
  workshop?: Partial<WorkshopDto>,
  content = documentContent(document)
) {
  const documents = [...(workshop?.workshopDocuments ?? [])].sort((a, b) => a.sortId - b.sortId);
  return {
    ...content,
    documents,
    workshopId: workshop?._id ?? '',
    workshopDocumentGroupId: workshop?.workshopDocumentGroupId ?? '',
    pageIndex: Math.max(
      0,
      documents.findIndex((item) => item._id === document._id)
    ),
  };
}

export function resolvedEntryContent(resolved: ResolvedWorkshopEntry) {
  if (resolved.kind === 'PAGE') {
    const content = documentContent(resolved.document);
    const document: WorkshopJourneyItem = { _id: resolved.document._id, name: resolved.document.name, sortId: resolved.document.sortId, kind: 'PAGE' };
    return { ...content, document, kind: resolved.kind };
  }
  return { document: resolved.entry, kind: resolved.kind, blocks: [] as NgxEditorJsBlock[], error: '' };
}

export function journeyViewModel(content: ReturnType<typeof resolvedEntryContent>, workshop?: Partial<WorkshopDto>) {
  const documents = [...(workshop?.workshopDocuments ?? [])];
  const document: WorkshopJourneyItem = documents.find(item => item._id === content.document._id)
    ?? content.document;
  return { ...content, document, documents, workshopId: workshop?._id ?? '',
    workshopDocumentGroupId: workshop?.workshopDocumentGroupId ?? '',
    pageIndex: Math.max(0, documents.findIndex(item => item._id === document._id)) };
}
