import { CertificateRequest } from './../models/CertificateRequest';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CertificateService {
  private apiUrl = `${environment.apiBaseUrl}/certificate`;

  constructor(private http: HttpClient) {}

  generateCertificate(userId: string, activityId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/generate`, {
      params: { userId, activityId },
      responseType: 'blob', // Указываем, что ожидаем бинарные данные (Blob)
    });
  }

  sendCertificateByEmail(certificateRequest: CertificateRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/send`, certificateRequest, {
      responseType: 'text'
    });
  }
}
