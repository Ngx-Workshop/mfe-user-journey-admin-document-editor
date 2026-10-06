import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AssessmentTestDto } from '@tmdjr/service-nestjs-assessment-test-contracts';
import { AssessmentTestPreviewComponent } from '../../../../../src/app/components/workshops-pages/documents/assessment-test-preview.component';

const test: AssessmentTestDto = {
  _id: 'linked-test',
  name: 'Linked assessment',
  subject: 'RXJS',
  level: 1,
  lastUpdated: '',
  __v: 0,
  testQuestions: [
    {
      question: 'First question?',
      choices: [{ value: 'Correct A' }, { value: 'Wrong A' }],
      answer: 'Correct A',
      correctResponse: 'First explanation',
      incorrectResponse: 'First correction',
    },
    {
      question: 'Second question?',
      choices: [{ value: 'Correct B' }, { value: 'Wrong B' }],
      answer: 'Correct B',
      correctResponse: 'Second explanation',
      incorrectResponse: 'Second correction',
    },
  ],
};

describe('Assessment learner preview', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  async function open() {
    const fixture = TestBed.createComponent(
      AssessmentTestPreviewComponent
    );
    fixture.componentRef.setInput('resourceId', test._id);
    fixture.componentRef.setInput('pageName', 'Workshop label');
    fixture.detectChanges();
    await fixture.whenStable();
    const request = http.expectOne(
      '/api/assessment-test/linked-test'
    );
    expect(request.request.withCredentials).toBeTrue();
    request.flush(test);
    await fixture.whenStable();
    return fixture;
  }
  it('shows exact linked metadata and a learner question journey with guarded submission and local results', async () => {
    const fixture = await open();
    const vm = fixture.componentInstance;
    const host: HTMLElement = fixture.nativeElement;
    expect(host.textContent).toContain('Workshop label');
    expect(host.textContent).toContain(test.name);
    expect(host.textContent).not.toContain('First question?');
    Array.from(host.querySelectorAll('button'))
      .find((button) =>
        button.textContent?.includes('Start preview')
      )!
      .click();
    await fixture.whenStable();
    expect(host.querySelectorAll('fieldset').length).toBe(2);
    expect(host.textContent).not.toContain('First explanation');
    const finish = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Finish preview')
    )!;
    expect(finish.disabled).toBeTrue();
    const radio = host.querySelector<HTMLInputElement>(
      'input[type="radio"]'
    )!;
    radio.click();
    vm.answer(1, 'invalid');
    vm.finish();
    expect(vm.submitted()).toBeFalse();
    expect(vm.answeredCount()).toBe(1);
    vm.answer(1, 'Wrong B');
    await fixture.whenStable();
    expect(finish.disabled).toBeFalse();
    finish.click();
    await fixture.whenStable();
    expect(host.textContent).toContain('1 of 2 correct');
    expect(host.textContent).toContain('First explanation');
    expect(host.textContent).toContain('Second correction');
    expect(host.textContent).toContain('Correct answer: Correct B');
    vm.answer(1, 'Correct B');
    expect(vm.score()).toBe(1);
    expect(host.querySelector('form')).toBeNull();
    vm.restart();
    await fixture.whenStable();
    expect(vm.answers()).toEqual({});
    expect(vm.submitted()).toBeFalse();
    expect(host.querySelector('form')).not.toBeNull();
    http.expectNone((request) => request.method !== 'GET');
  });
  it('cancels stale reads and resets answers when a different linked test opens on the reused view', async () => {
    const fixture = await open();
    const vm = fixture.componentInstance;
    vm.started.set(true);
    vm.answer(0, 'Correct A');
    fixture.componentRef.setInput('resourceId', 'second');
    await fixture.whenStable();
    const stale = http.expectOne('/api/assessment-test/second');
    expect(vm.answers()).toEqual({});
    expect(vm.started()).toBeFalse();
    expect(vm.state().test).toBeNull();
    fixture.componentRef.setInput('resourceId', 'third');
    await fixture.whenStable();
    expect(stale.cancelled).toBeTrue();
    http
      .expectOne('/api/assessment-test/third')
      .flush({
        ...test,
        _id: 'third',
        name: 'Third test',
        testQuestions: [],
      });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Third test');
    expect(fixture.nativeElement.textContent).toContain(
      'no questions yet'
    );
  });
  for (const status of [404, 403, 500])
    it(`recovers from ${status} with retry`, async () => {
      const fixture = TestBed.createComponent(
        AssessmentTestPreviewComponent
      );
      fixture.componentRef.setInput('resourceId', 'missing');
      fixture.componentRef.setInput('pageName', 'Assessment');
      await fixture.whenStable();
      http
        .expectOne('/api/assessment-test/missing')
        .flush({}, { status, statusText: 'Failure' });
      await fixture.whenStable();
      expect(
        fixture.nativeElement.querySelector('[role="alert"]')
      ).not.toBeNull();
      expect(fixture.nativeElement.querySelector('form')).toBeNull();
      fixture.componentInstance.retry();
      await fixture.whenStable();
      http.expectOne('/api/assessment-test/missing').flush(test);
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toContain(test.name);
    });
});
