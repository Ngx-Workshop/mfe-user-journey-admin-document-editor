import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PublishedLabDto } from '@tmdjr/coding-labs-contracts';
import { CodingLabPreviewComponent } from '../../../../../../src/app/features/document-editor/pages/documents/coding-lab-preview.component';
import { instructionBlocks } from '../../../../../../src/app/features/document-editor/pages/documents/lab-instructions.component';

const lab: PublishedLabDto = {
  labId: 'linked-lab',
  versionId: 'published-version',
  versionNumber: 3,
  title: 'Sum values',
  difficulty: 'easy',
  language: 'javascript',
  entryFnName: 'sum',
  promptMarkdown:
    '# Sum\n\nAdd the numbers.\n\n- Return a number\n\n```js\nsum([1,2])\n```\n\n<script>alert(1)</script>',
  starterCode: 'function sum(values) {\n  return 0;\n}',
  hints: ['Try a loop'],
  sampleTests: [
    {
      name: 'Positive values',
      kind: 'io',
      input: { values: [1, 2] },
      expected: 3,
    },
  ],
};

describe('Coding lab learner preview', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  async function open() {
    const fixture = TestBed.createComponent(
      CodingLabPreviewComponent
    );
    fixture.componentRef.setInput('resourceId', lab.labId);
    fixture.componentRef.setInput('pageName', 'Workshop lab label');
    await fixture.whenStable();
    const request = http.expectOne(
      '/api/coding-labs/published-labs/linked-lab'
    );
    expect(request.request.withCredentials).toBeTrue();
    expect(request.request.params.keys()).toEqual([]);
    request.flush(lab);
    await fixture.whenStable();
    return fixture;
  }
  it('renders safe published content, hints and examples with local code edits/reset and no writes', async () => {
    const fixture = await open();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.textContent).toContain('Workshop lab label');
    expect(host.textContent).toContain('Version 3');
    expect(
      host.querySelector('ngx-lab-instructions h3')?.textContent
    ).toBe('Sum');
    expect(
      host.querySelector('ngx-lab-instructions li')?.textContent
    ).toBe('Return a number');
    expect(
      host.querySelector('ngx-lab-instructions pre')?.textContent
    ).toBe('sum([1,2])');
    expect(host.querySelector('script')).toBeNull();
    expect(host.textContent).toContain('<script>alert(1)</script>');
    const hint = host.querySelector<HTMLDetailsElement>('details')!;
    expect(hint.open).toBeFalse();
    hint.querySelector('summary')!.click();
    expect(hint.open).toBeTrue();
    expect(hint.textContent).toContain('Try a loop');
    expect(host.textContent).toContain('Positive values');
    expect(host.textContent).toContain('Expected output');
    const code = host.querySelector<HTMLTextAreaElement>('textarea')!;
    expect(code.value).toBe(lab.starterCode);
    code.value = 'function sum(values) { return 3; }';
    code.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(fixture.componentInstance.code.value).toBe(code.value);
    const reset = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Reset starter code')
    )!;
    expect(reset.disabled).toBeFalse();
    reset.click();
    await fixture.whenStable();
    expect(code.value).toBe(lab.starterCode);
    expect(reset.disabled).toBeTrue();
    http.expectNone((request) => request.method !== 'GET');
    http.expectNone((request) => request.url.includes('/versions'));
  });
  it('clears previous local work and cancels stale reads when navigating to another lab', async () => {
    const fixture = await open();
    fixture.componentInstance.code.setValue('previous work');
    fixture.componentRef.setInput('resourceId', 'second');
    await fixture.whenStable();
    const stale = http.expectOne(
      '/api/coding-labs/published-labs/second'
    );
    expect(fixture.componentInstance.code.value).toBe('');
    expect(fixture.componentInstance.state().lab).toBeNull();
    fixture.componentRef.setInput('resourceId', 'third');
    await fixture.whenStable();
    expect(stale.cancelled).toBeTrue();
    http
      .expectOne('/api/coding-labs/published-labs/third')
      .flush({
        ...lab,
        labId: 'third',
        title: 'Third lab',
        starterCode: 'new code',
        hints: [],
        sampleTests: [],
        promptMarkdown: '',
      });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Third lab');
    expect(fixture.nativeElement.textContent).toContain(
      'No sample tests'
    );
    expect(fixture.nativeElement.textContent).toContain(
      'No instructions'
    );
    expect(fixture.componentInstance.code.value).toBe('new code');
  });
  for (const status of [404, 403, 500])
    it(`shows ${status} and recovers on retry`, async () => {
      const fixture = TestBed.createComponent(
        CodingLabPreviewComponent
      );
      fixture.componentRef.setInput('resourceId', 'missing');
      fixture.componentRef.setInput('pageName', 'Lab');
      await fixture.whenStable();
      http
        .expectOne('/api/coding-labs/published-labs/missing')
        .flush({}, { status, statusText: 'Failure' });
      await fixture.whenStable();
      expect(
        fixture.nativeElement.querySelector('[role="alert"]')
      ).not.toBeNull();
      expect(
        fixture.nativeElement.querySelector('textarea')
      ).toBeNull();
      fixture.componentInstance.retry();
      await fixture.whenStable();
      http
        .expectOne('/api/coding-labs/published-labs/missing')
        .flush(lab);
      await fixture.whenStable();
      expect(fixture.componentInstance.code.value).toBe(
        lab.starterCode
      );
    });
  it('handles a missing reference without a request', async () => {
    const fixture = TestBed.createComponent(
      CodingLabPreviewComponent
    );
    fixture.componentRef.setInput('resourceId', '');
    fixture.componentRef.setInput('pageName', 'Lab');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(
      'no linked coding lab'
    );
    http.expectNone(() => true);
  });
  it('handles an unfinished code fence and adjacent block types without inserting HTML', () => {
    expect(
      instructionBlocks('paragraph\n# Heading\n1. item\n```\n<x>')
    ).toEqual([
      { kind: 'text', text: 'paragraph', items: [] },
      { kind: 'heading', text: 'Heading', items: [] },
      { kind: 'list', text: '', items: ['item'] },
      { kind: 'code', text: '<x>', items: [] },
    ]);
  });
});
