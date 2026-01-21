import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  CreateWorkshopPageDto,
  DeletePageParamsDto,
  DeleteResultDto,
  EditPageNameUpdateWorkshopDto,
  UpdateWorkshopDto,
  WorkshopDto,
  WorkshopPageDto,
  WorkshopPageIdentifierDto,
} from '@tmdjr/document-contracts';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { KeyValue } from '../interfaces/common.interface';

export interface CloudinaryUploadResponse {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  pages: number;
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  original_filename: string;
  api_key: string;
}

export interface Result<T> {
  success?: T;
  error?: number;
}

@Injectable({
  providedIn: 'root',
})
export class WorkshopEditorService {
  private readonly baseUrl = '/api/documents';
  private httpClient = inject(HttpClient);

  saveEditorDataSubject = new Subject<unknown>();
  saveEditorData$ = this.saveEditorDataSubject.asObservable();
  savePageHTML(html: string, _id: string) {
    return this.apiCall<WorkshopPageDto>(
      '/workshop/update-workshop-html',
      { _id, html }
    );
  }

  private apiCall<T>(
    url: string,
    body: unknown,
    method: 'post' | 'get' = 'post',
    params?: HttpParams
  ) {
    const request = this.httpClient.request<T>(
      method,
      this.baseUrl + url,
      {
        body,
        params,
      }
    );

    return request.pipe(
      map((data: T) => ({ success: data } as Result<T>))
    );
  }

  createWorkshop(workshop: UpdateWorkshopDto) {
    return this.apiCall<WorkshopDto>(
      '/navigation/workshop/create-workshop',
      workshop
    );
  }

  editWorkshopNameAndSummary(workshop: UpdateWorkshopDto) {
    return this.apiCall<WorkshopDto>(
      '/navigation/workshop/edit-workshop-name-and-summary',
      workshop
    );
  }

  deleteWorkshop(_id: string) {
    return this.apiCall<{ id: string }>(
      '/navigation/workshop/delete-workshop-and-workshop-documents',
      { _id }
    );
  }

  sortWorkshops(workshop: UpdateWorkshopDto[]) {
    return this.apiCall<WorkshopDto[]>(
      '/navigation/workshop/sort-workshops',
      workshop
    );
  }

  createPage(page: CreateWorkshopPageDto) {
    return this.apiCall<WorkshopDto>(
      '/navigation/page/create-page',
      page
    );
  }

  deletePage(page: DeletePageParamsDto) {
    return this.apiCall<DeleteResultDto>(
      '/navigation/page/delete-page-and-update-workshop',
      page
    );
  }

  editPageName(page: EditPageNameUpdateWorkshopDto) {
    return this.apiCall<WorkshopDto>(
      '/navigation/page/edit-page-name-update-workshop',
      page
    );
  }

  sortDocuments(
    pages: WorkshopPageIdentifierDto[],
    workshopId: string
  ) {
    const params = new HttpParams().set('workshopId', workshopId);
    return this.apiCall<WorkshopDto[]>(
      '/navigation/page/sort-pages',
      pages,
      'post',
      params
    );
  }

  uploadImage(formData: FormData) {
    return this.apiCall<CloudinaryUploadResponse>(
      '/uploader/image-upload',
      formData,
      'post'
    );
  }

  ifErrorsSetMessages(
    formGroup: FormGroup,
    formControlMessages: KeyValue,
    errorMessages: KeyValue
  ): boolean {
    let errorMessage = false;
    Object.keys(formGroup.controls).forEach((element) => {
      const errors = formGroup.get(element)?.errors;
      if (errors) {
        errorMessage = true;
        formControlMessages[element] =
          errorMessages[Object.keys(errors)[0]];
      }
    });
    return errorMessage;
  }
}
