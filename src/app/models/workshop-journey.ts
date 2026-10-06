import { WorkshopDto, WorkshopPageDto } from '@tmdjr/document-contracts';

export type WorkshopJourneyItem = WorkshopDto['workshopDocuments'][number];
export type WorkshopPageKind = WorkshopJourneyItem['kind'];
export type ResolvedWorkshopEntry =
  | { kind: 'PAGE'; document: WorkshopPageDto }
  | { kind: 'ASSESSMENT_TEST' | 'CODING_LAB'; entry: Exclude<WorkshopJourneyItem, { kind: 'PAGE' }> };
