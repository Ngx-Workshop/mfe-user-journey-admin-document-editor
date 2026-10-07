import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NgxEditorJsBlock } from '@tmdjr/ngx-editor-js2';
import { EditorStateService } from '../../../../../src/app/features/document-editor/state/editor-state.service';

const endpoint = '/api/documents/workshop/update-workshop-html';
const blocks: NgxEditorJsBlock[] = [
  {
    blockId: '1',
    sortIndex: 0,
    componentInstanceName: 'paragraph',
    dataClean: 'First',
  },
];

describe('Editor save state', () => {
  let http: HttpTestingController;
  let state: EditorStateService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    state = TestBed.inject(EditorStateService);
  });
  afterEach(() => http.verify());

  it('serializes requests and snapshots blocks at the time of the edit', () => {
    state.save('page-1', blocks);
    const first = http.expectOne(endpoint);
    const changed = [{ ...blocks[0], dataClean: 'Second' }];
    state.save('page-1', changed);
    changed[0].dataClean = 'Later mutation';
    http.expectNone(endpoint);
    expect(state.pending()).toBe(2);
    expect(first.request.body).toEqual({
      _id: 'page-1',
      html: JSON.stringify(blocks),
    });
    first.flush({});
    const second = http.expectOne(endpoint);
    expect(JSON.parse(second.request.body.html)[0].dataClean).toBe(
      'Second'
    );
    second.flush({});
    expect(state.pending()).toBe(0);
  });

  it('retains a failed latest edit for retry and continues accepting subsequent saves', () => {
    state.save('page-1', blocks);
    http
      .expectOne(endpoint)
      .flush({}, { status: 500, statusText: 'Failure' });
    expect(state.hasFailed('page-1')).toBeTrue();
    expect(state.pending()).toBe(0);
    state.retry('page-1');
    const retry = http.expectOne(endpoint);
    expect(retry.request.body.html).toBe(JSON.stringify(blocks));
    retry.flush({});
    expect(state.hasFailed('page-1')).toBeFalse();
    state.save('page-2', []);
    http.expectOne(endpoint).flush({});
    expect(state.pending()).toBe(0);
  });

  it('never retries an obsolete failed revision over a more recent edit', () => {
    state.save('page-1', blocks);
    const old = http.expectOne(endpoint);
    state.save('page-1', []);
    old.flush({}, { status: 500, statusText: 'Failure' });
    expect(state.hasFailed('page-1')).toBeFalse();
    state.retry('page-1');
    http.expectOne(endpoint).flush({});
    http.expectNone(endpoint);
  });
});
