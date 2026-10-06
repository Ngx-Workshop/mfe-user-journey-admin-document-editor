import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AssessmentTestDto } from '@tmdjr/service-nestjs-assessment-test-contracts';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AssessmentTestsApiService {
  private readonly http = inject(HttpClient);
  getTest(id: string) {
    return this.http.get<AssessmentTestDto>(`${environment.assessmentTestsApiBaseUrl}/${encodeURIComponent(id)}`, { withCredentials: true });
  }
  listTests() {
    return this.http.get<AssessmentTestDto[]>(environment.assessmentTestsApiBaseUrl, { withCredentials: true });
  }
}
