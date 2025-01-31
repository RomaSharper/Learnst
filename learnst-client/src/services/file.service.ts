import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = `${environment.apiBaseUrl}/file`;

  constructor(private http: HttpClient) { }

  upload(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<any>(this.apiUrl, formData);
  }

  delete(path: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}?path=\\wwwroot\\${path}`);
  }
}
