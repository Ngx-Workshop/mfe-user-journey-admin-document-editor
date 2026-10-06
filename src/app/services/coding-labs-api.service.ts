import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { HandsOnLabMongo } from '@tmdjr/coding-labs-contracts';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CodingLabsApiService {
  private readonly http = inject(HttpClient);
  listLabs(query: string, skip: number, limit: number) {
    return this.http.get<HandsOnLabMongo[]>(`${environment.codingLabsApiBaseUrl}/labs`, {
      withCredentials: true,
      params: { q: query, skip, limit },
    });
  }
}
