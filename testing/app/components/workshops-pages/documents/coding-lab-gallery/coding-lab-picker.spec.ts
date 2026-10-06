import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HandsOnLabMongo } from '@tmdjr/coding-labs-contracts';
import { CodingLabPickerComponent } from '../../../../../../src/app/components/workshops-pages/documents/coding-lab-gallery/coding-lab-picker.component';

const lab: HandsOnLabMongo = {
  _id: 'lab-id',
  workshopId: 'workshop',
  title: 'Reactive streams',
  slug: 'streams',
  summary: 'Practice RxJS',
  tags: ['Angular', 'RxJS'],
  difficulty: 'intro',
  estimatedMinutes: 20,
  status: 'published',
  createdAt: '',
  createdBy: '',
  updatedAt: '',
  updatedBy: '',
};

describe('Coding lab gallery picker', () => {
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
  const request = () =>
    http.expectOne((req) => req.url === '/api/coding-labs/labs');

  it('loads authenticated metadata, excludes archived labs, and selects with an accessible card', async () => {
    const fixture = TestBed.createComponent(CodingLabPickerComponent);
    const response = request();
    expect(response.request.withCredentials).toBeTrue();
    expect(response.request.params.get('limit')).toBe('24');
    response.flush([
      lab,
      { ...lab, _id: 'archived', status: 'archived' },
    ]);
    let selected: HandsOnLabMongo | undefined;
    fixture.componentInstance.selected.subscribe(
      (value) => (selected = value)
    );
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const cards = host.querySelectorAll<HTMLButtonElement>(
      '.lab-gallery__card'
    );
    expect(cards.length).toBe(1);
    expect(host.textContent).toContain('Practice RxJS');
    expect(host.textContent).toContain('20 min');
    expect(host.textContent).toContain('Published');
    expect(host.textContent).toContain('Angular');
    expect(cards[0].type).toBe('button');
    expect(cards[0].getAttribute('aria-label')).toBe(
      'Select Reactive streams'
    );
    cards[0].click();
    expect(selected).toEqual(lab);
    fixture.componentRef.setInput('selectedId', lab._id);
    fixture.componentRef.setInput('selectedLab', lab);
    await fixture.whenStable();
    expect(cards[0].getAttribute('aria-pressed')).toBe('true');
    expect(host.textContent).toContain('Selected:');
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    expect(cards[0].disabled).toBeTrue();
    selected = undefined;
    fixture.componentInstance.choose(lab);
    fixture.componentInstance.search();
    expect(selected).toBeUndefined();
    http.expectNone((req) => req.url === '/api/coding-labs/labs');
  });

  it('searches, pages and retries without losing selected lab or duplicating cards', async () => {
    const fixture = TestBed.createComponent(CodingLabPickerComponent);
    request().flush(
      Array.from({ length: 24 }, (_, i) => ({
        ...lab,
        _id: `lab-${i}`,
      }))
    );
    fixture.componentRef.setInput('selectedId', 'lab-0');
    fixture.componentRef.setInput('selectedLab', {
      ...lab,
      _id: 'lab-0',
    });
    const vm = fixture.componentInstance;
    vm.loadMore();
    const more = request();
    expect(more.request.params.get('skip')).toBe('24');
    vm.loadMore();
    http.expectNone((req) => req.url === '/api/coding-labs/labs');
    more.flush({}, { status: 500, statusText: 'Failure' });
    expect(vm.labs().length).toBe(24);
    expect(vm.error()).toContain('Please try again');
    vm.retry();
    const retry = request();
    expect(retry.request.params.get('skip')).toBe('24');
    retry.flush([
      { ...lab, _id: 'lab-0' },
      { ...lab, _id: 'new-lab', status: 'draft' },
    ]);
    expect(vm.labs().length).toBe(25);
    expect(vm.hasMore()).toBeFalse();
    vm.query.setValue('  angular  ');
    vm.search();
    const search = request();
    expect(search.request.params.get('q')).toBe('angular');
    expect(search.request.params.get('skip')).toBe('0');
    search.flush([]);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(
      'No coding labs found'
    );
    expect(fixture.nativeElement.textContent).toContain('Selected:');
    expect(vm.selectedId()).toBe('lab-0');
  });

  it('shows permission errors, exposes retry and recovers an empty catalog', async () => {
    const fixture = TestBed.createComponent(CodingLabPickerComponent);
    request().flush({}, { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('[role="alert"]')
        .textContent
    ).toContain('Administrator access');
    fixture.componentInstance.retry();
    request().flush([]);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('[role="alert"]')
    ).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'No coding labs found'
    );
  });
});
