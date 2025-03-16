import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private apiUrl = `${environment.apiBaseUrl}/email`;

  constructor(private http: HttpClient) { }

  sendVerificationCode(to: string): Observable<{ code: string }> {
    return this.http.post<{ code: string }>(`${this.apiUrl}/send-code`, {
      email: to
    });
  }
}
