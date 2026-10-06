import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  CreateSectionDto,
  CreateWorkshopPageDto,
  DeletePageParamsDto,
  DeleteResultDto,
  EditPageNameUpdateWorkshopDto,
  SectionDto,
  SectionsMapDto,
  UpdateSectionDto,
  UpdateWorkshopDto,
  WorkshopDto,
  WorkshopPageDto,
  AddWorkshopReferenceDto,
} from '@tmdjr/document-contracts';
import { map } from 'rxjs/operators';
import { WorkshopJourneyItem } from '../models/workshop-journey';
import { environment } from '../../environments/environment';

export interface Result<T> {
  success?: T;
  error?: number;
}

@Injectable({
  providedIn: 'root',
})
export class DocumentApiService {
  private readonly baseUrl = environment.documentsApiBaseUrl;
  private httpClient = inject(HttpClient);

  fetchSections() {
    return this.httpClient.get<SectionsMapDto>(`${this.baseUrl}/navigation/sections`);
  }

  fetchSectionWorkshops(section: string) {
    return this.httpClient.get<WorkshopDto[]>(`${this.baseUrl}/navigation/workshops`, {
      params: { section },
    });
  }

  getDocument(id: string) {
    return this.httpClient.get<WorkshopPageDto>(`${this.baseUrl}/workshop/${id}`);
  }

  savePageHTML(html: string, _id: string) {
    return this.apiCall<WorkshopPageDto>('/workshop/update-workshop-html', { _id, html });
  }

  private apiCall<T>(
    url: string,
    body: unknown,
    method: 'post' | 'get' = 'post',
    params?: HttpParams
  ) {
    const request = this.httpClient.request<T>(method, this.baseUrl + url, {
      body,
      params,
    });

    return request.pipe(map((data: T) => ({ success: data }) as Result<T>));
  }

  createSection(section: CreateSectionDto & Pick<SectionDto, 'menuSvgPath' | 'headerSvgPath'>) {
    return this.httpClient.post<SectionDto>(
      `${this.baseUrl}/navigation/section/create-section`,
      section
    );
  }

  getSection(id: string) {
    return this.httpClient.get<SectionDto>(
      `${this.baseUrl}/navigation/section/${encodeURIComponent(id)}`
    );
  }

  updateSection(id: string, section: UpdateSectionDto) {
    return this.httpClient.patch<SectionDto>(
      `${this.baseUrl}/navigation/section/${encodeURIComponent(id)}`,
      section
    );
  }

  deleteSection(id: string) {
    return this.httpClient.delete<DeleteResultDto>(
      `${this.baseUrl}/navigation/section/${encodeURIComponent(id)}`
    );
  }

  createWorkshop(workshop: UpdateWorkshopDto) {
    return this.apiCall<WorkshopDto>('/navigation/workshop/create-workshop', workshop);
  }

  editWorkshopNameAndSummary(workshop: UpdateWorkshopDto) {
    return this.apiCall<WorkshopDto>(
      '/navigation/workshop/edit-workshop-name-and-summary',
      workshop
    );
  }

  deleteWorkshop(_id: string) {
    return this.apiCall<DeleteResultDto>(
      '/navigation/workshop/delete-workshop-and-workshop-documents',
      { _id }
    );
  }

  sortWorkshops(workshop: UpdateWorkshopDto[]) {
    return this.apiCall<WorkshopDto[]>('/navigation/workshop/sort-workshops', workshop);
  }

  createPage(page: CreateWorkshopPageDto) {
    return this.apiCall<WorkshopDto>('/navigation/page/create-page', page);
  }

  addReference(reference: AddWorkshopReferenceDto) {
    return this.apiCall<WorkshopDto>('/navigation/page/add-reference', reference);
  }

  deletePage(page: DeletePageParamsDto) {
    return this.apiCall<DeleteResultDto>('/navigation/page/delete-page-and-update-workshop', page);
  }

  editPageName(page: EditPageNameUpdateWorkshopDto) {
    return this.apiCall<WorkshopDto>('/navigation/page/edit-page-name-update-workshop', page);
  }

  sortDocuments(pages: WorkshopJourneyItem[], workshopId: string) {
    const params = new HttpParams().set('workshopId', workshopId);
    return this.apiCall<WorkshopDto>('/navigation/page/sort-pages', pages, 'post', params);
  }
}
