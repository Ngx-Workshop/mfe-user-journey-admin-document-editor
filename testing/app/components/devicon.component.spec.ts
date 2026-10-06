import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  IsDeviconPipe,
  MenuDeviconComponent,
} from '../../../src/app/components/devicon.component';

describe('Devicon artwork classification', () => {
  const pipe = new IsDeviconPipe();

  it('recognizes trimmed Devicon classes with modifiers', () => {
    for (const value of [
      'devicon-angular-plain',
      ' devicon-angular-plain colored ',
      'devicon-react-original colored',
      'devicon-cplusplus-line-wordmark',
    ]) {
      expect(pipe.transform(value)).withContext(value).toBeTrue();
    }
  });

  it('keeps URLs, file paths, Material names and empty values out of the Devicon branch', () => {
    for (const value of [
      null,
      undefined,
      '',
      ' ',
      'image',
      '/images/angular.svg',
      'devicon-angular.svg',
      'devicon-react-original.png',
      'https://example.test/devicon-angular-plain.svg',
      'data:image/svg+xml,<svg/>',
    ]) {
      expect(pipe.transform(value))
        .withContext(String(value))
        .toBeFalse();
    }
  });
});

describe('MenuDeviconComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    })
  );

  it('renders one decorative class icon and retains the existing Material fallback', async () => {
    const fixture = TestBed.createComponent(MenuDeviconComponent);
    fixture.componentRef.setInput(
      'icon',
      ' devicon-angular-plain colored '
    );
    fixture.componentRef.setInput('large', true);
    await fixture.whenStable();
    const icon = fixture.nativeElement.querySelector(
      'i'
    ) as HTMLElement;
    expect(
      icon.classList.contains('devicon-angular-plain')
    ).toBeTrue();
    expect(icon.classList.contains('colored')).toBeTrue();
    expect(icon.classList.contains('devicon--large')).toBeTrue();
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(
      fixture.nativeElement.querySelector('mat-icon')
    ).toBeNull();
    fixture.componentRef.setInput('icon', 'image');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('i')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('mat-icon')?.textContent
    ).toBe('image');
  });
});
