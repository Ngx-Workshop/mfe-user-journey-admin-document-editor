import {
  WorkshopDto,
  WorkshopPageDto,
} from '@tmdjr/document-contracts';
import {
  documentContent,
  documentViewModel,
} from '../../../src/app/view-models/document-view-model';

const page: WorkshopPageDto = {
  _id: 'page-1',
  name: 'Introduction',
  pageType: 'PAGE',
  html: '[]',
  workshopGroupId: 'workshop',
  sortId: 0,
  lastUpdated: '',
  __v: 0,
};

describe('Document view model', () => {
  it('contains malformed JSON and non-array content without failing the route stream', () => {
    for (const html of ['broken json', '{"blocks":[]}']) {
      const vm = documentViewModel({ ...page, html });
      expect(vm.error).toContain('could not be read');
      expect(vm.blocks).toEqual([]);
    }
    expect(documentViewModel(page).error).toBe('');
  });

  it('preserves the block input identity when only workshop metadata changes', () => {
    const content = documentContent(page);
    const first = documentViewModel(
      page,
      { name: 'Before' },
      content
    );
    const next = documentViewModel(page, { name: 'After' }, content);
    expect(next.blocks).toBe(first.blocks);
  });

  it('sorts references without mutating shared state and finds the active paginator index', () => {
    const workshop: Partial<WorkshopDto> = {
      workshopDocuments: [
        {
          _id: 'page-1',
          kind: 'PAGE' as const,
          name: 'First',
          sortId: 1,
        },
        {
          _id: 'page-2',
          kind: 'PAGE' as const,
          name: 'Second',
          sortId: 0,
        },
      ],
    };
    const vm = documentViewModel(page, workshop);
    expect(vm.documents.map((item) => item._id)).toEqual([
      'page-2',
      'page-1',
    ]);
    expect(vm.pageIndex).toBe(1);
    expect(workshop.workshopDocuments?.[0]._id).toBe('page-1');
  });
});
