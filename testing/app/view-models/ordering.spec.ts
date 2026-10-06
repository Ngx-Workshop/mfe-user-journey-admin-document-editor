import { reorder } from '../../../src/app/view-models/ordering';

describe('Immutable ordering', () => {
  it('assigns order without changing the original array or its records', () => {
    const items = Object.freeze([
      Object.freeze({ _id: 'a', sortId: 0 }),
      Object.freeze({ _id: 'b', sortId: 1 }),
    ]);
    const ordered = reorder<{ _id: string; sortId: number }>(
      items,
      0,
      1
    );
    expect(ordered).toEqual([
      { _id: 'b', sortId: 0 },
      { _id: 'a', sortId: 1 },
    ]);
    expect(items[0].sortId).toBe(0);
    expect(items[1].sortId).toBe(1);
    expect(ordered[0]).not.toBe(items[1]);
  });
});
