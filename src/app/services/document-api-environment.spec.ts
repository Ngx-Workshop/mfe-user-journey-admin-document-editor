import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { NavigationService } from './navigation.service';
import { WorkshopEditorService } from './workshops.service';

describe('document API environment routing', () => {
  const original = environment.documentsApiBaseUrl;
  afterEach(() => {
    environment.documentsApiBaseUrl = original;
    TestBed.inject(HttpTestingController).verify();
  });
  for (const baseUrl of ['/api/documents', 'http://localhost:3007']) {
    it(`routes reads and writes to ${baseUrl}`, () => {
      environment.documentsApiBaseUrl = baseUrl;
      TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideHttpClientTesting()],
      });
      const http = TestBed.inject(HttpTestingController);
      const navigation = TestBed.inject(NavigationService);
      const editor = TestBed.inject(WorkshopEditorService);
      navigation.fetchSections().subscribe();
      http
        .expectOne(`${baseUrl}/navigation/sections`)
        .flush({ sections: {} });
      navigation.navigateToSection('test').subscribe();
      http
        .expectOne(`${baseUrl}/navigation/workshops?section=test`)
        .flush([]);
      navigation.navigateToDocument('page-id').subscribe();
      http.expectOne(`${baseUrl}/workshop/page-id`).flush({});
      editor.createSection({
        sectionTitle: 'Test',
        sectionDescription: 'Test workshops',
        menuSvgPath: '',
        headerSvgPath: '',
      }).subscribe();
      const sectionCreate = http.expectOne(`${baseUrl}/navigation/section/create-section`);
      expect(sectionCreate.request.body).toEqual({
        sectionTitle: 'Test',
        sectionDescription: 'Test workshops',
        menuSvgPath: '',
        headerSvgPath: '',
      });
      sectionCreate.flush({});
      editor.getSection('legacy section').subscribe();
      const sectionRead = http.expectOne(`${baseUrl}/navigation/section/legacy%20section`);
      expect(sectionRead.request.method).toBe('GET');
      sectionRead.flush({});
      editor.updateSection('legacy section', { sectionDescription: '', headerSvgPath: '' }).subscribe();
      const sectionUpdate = http.expectOne(`${baseUrl}/navigation/section/legacy%20section`);
      expect(sectionUpdate.request.method).toBe('PATCH');
      expect(sectionUpdate.request.body).toEqual({ sectionDescription: '', headerSvgPath: '' });
      sectionUpdate.flush({});
      editor.savePageHTML('[]', 'page-id').subscribe();
      const save = http.expectOne(
        `${baseUrl}/workshop/update-workshop-html`
      );
      expect(save.request.body).toEqual({
        _id: 'page-id',
        html: '[]',
      });
      save.flush({});
    });
  }
});
