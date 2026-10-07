import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AssessmentTestDto } from '@tmdjr/service-nestjs-assessment-test-contracts';
import { AssessmentTestPickerComponent } from '../../../../../../../src/app/features/document-editor/pages/documents/assessment-test-gallery/assessment-test-picker.component';

const assessment: AssessmentTestDto = {
  _id: 'test-id',
  name: 'Angular fundamentals',
  subject: 'ANGULAR',
  level: 2,
  lastUpdated: '2026-10-06T12:00:00.000Z',
  __v: 0,
  testQuestions: [
    {
      question: 'Internal question',
      choices: [],
      answer: 'SECRET ANSWER',
      correctResponse: '',
      incorrectResponse: '',
    },
  ],
};

describe('Assessment test gallery picker', () => {
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

  it('loads authenticated metadata and exposes keyboard selection without displaying questions or answers', async () => {
    const fixture = TestBed.createComponent(
      AssessmentTestPickerComponent
    );
    const request = http.expectOne('/api/assessment-test');
    expect(request.request.withCredentials).toBeTrue();
    expect(request.request.params.keys()).toEqual([]);
    request.flush([assessment]);
    let selected: AssessmentTestDto | undefined;
    fixture.componentInstance.selected.subscribe(
      (value) => (selected = value)
    );
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const button = host.querySelector<HTMLButtonElement>(
      '.assessment-gallery__card'
    )!;
    expect(button.type).toBe('button');
    expect(button.getAttribute('aria-label')).toBe(
      'Select Angular fundamentals'
    );
    expect(host.textContent).toContain('ANGULAR');
    expect(host.textContent).toContain('Level 2');
    expect(host.textContent).toContain('1 question');
    expect(host.textContent).toContain('Updated');
    expect(host.textContent).not.toContain('SECRET ANSWER');
    expect(host.textContent).not.toContain('Internal question');
    button.click();
    expect(selected).toEqual(assessment);
    fixture.componentRef.setInput('selectedId', assessment._id);
    fixture.componentRef.setInput('selectedTest', assessment);
    await fixture.whenStable();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(host.textContent).toContain('Selected:');
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    expect(button.disabled).toBeTrue();
    selected = undefined;
    fixture.componentInstance.choose(assessment);
    fixture.componentInstance.retry();
    expect(selected).toBeUndefined();
    http.expectNone('/api/assessment-test');
  });

  it('locally searches, filters subjects, reveals more and retains selection without extra requests', async () => {
    const fixture = TestBed.createComponent(
      AssessmentTestPickerComponent
    );
    const vm = fixture.componentInstance;
    http
      .expectOne('/api/assessment-test')
      .flush(
        Array.from({ length: 30 }, (_, index) => ({
          ...assessment,
          _id: `test-${index}`,
          name: `Example ${index}`,
          subject: index % 2 ? 'RXJS' : 'ANGULAR',
        }))
      );
    expect(vm.visibleTests().length).toBe(24);
    expect(vm.hasMore()).toBeTrue();
    vm.loadMore();
    expect(vm.visibleTests().length).toBe(30);
    expect(vm.hasMore()).toBeFalse();
    fixture.componentRef.setInput('selectedId', 'test-0');
    fixture.componentRef.setInput('selectedTest', {
      ...assessment,
      _id: 'test-0',
    });
    vm.subject.setValue('RXJS');
    vm.query.setValue('  EXAMPLE  ');
    vm.search();
    expect(vm.filteredTests().length).toBe(15);
    expect(
      vm.visibleTests().every((test) => test.subject === 'RXJS')
    ).toBeTrue();
    vm.query.setValue('missing');
    vm.search();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(
      'No assessment tests found'
    );
    expect(fixture.nativeElement.textContent).toContain('Selected:');
    expect(vm.selectedId()).toBe('test-0');
    http.expectNone('/api/assessment-test');
    vm.subject.setValue('');
    vm.query.setValue('');
    vm.search();
    expect(vm.visibleTests().length).toBe(24);
  });

  for (const status of [403, 500]) {
    it(`recovers ${status} errors with retry and an empty catalog`, async () => {
      const fixture = TestBed.createComponent(
        AssessmentTestPickerComponent
      );
      let selected: AssessmentTestDto | undefined;
      fixture.componentInstance.selected.subscribe(
        (value) => (selected = value)
      );
      fixture.componentInstance.choose(assessment);
      fixture.componentInstance.retry();
      expect(selected).toBeUndefined();
      http
        .expectOne('/api/assessment-test')
        .flush({}, { status, statusText: 'Failure' });
      await fixture.whenStable();
      expect(
        fixture.nativeElement.querySelector('[role="alert"]')
          .textContent
      ).toContain(
        status === 403 ? 'Administrator access' : 'Please try again'
      );
      fixture.componentInstance.retry();
      http.expectOne('/api/assessment-test').flush([]);
      await fixture.whenStable();
      expect(
        fixture.nativeElement.querySelector('[role="alert"]')
      ).toBeNull();
      expect(fixture.nativeElement.textContent).toContain(
        'No assessment tests found'
      );
    });
  }
});
