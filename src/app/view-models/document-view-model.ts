import { WorkshopDto, WorkshopPageDto } from '@tmdjr/document-contracts';
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
