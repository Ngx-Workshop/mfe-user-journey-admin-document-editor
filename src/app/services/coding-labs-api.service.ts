import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  HandsOnLabMongo,
  PublishedLabDto,
} from '@tmdjr/coding-labs-contracts';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CodingLabsApiService {
  private readonly http = inject(HttpClient);
  getPublishedLab(id: string) {
    return this.http.get<PublishedLabDto>(
      `${
        environment.codingLabsApiBaseUrl
      }/published-labs/${encodeURIComponent(id)}`,
      { withCredentials: true }
    );
  }
  listLabs(query: string, skip: number, limit: number) {
    return this.http.get<HandsOnLabMongo[]>(
      `${environment.codingLabsApiBaseUrl}/labs`,
      {
        withCredentials: true,
        params: { q: query, skip, limit },
      }
    );
  }
}
