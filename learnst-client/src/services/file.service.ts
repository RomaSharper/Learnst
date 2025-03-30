import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/file`;

  upload(file: File): Observable<any> {
    const formData = new FormData();

    // Обезвреживаем имя файла
    const safeFileName = this.sanitizeFileName(file.name);
    formData.append('file', file, safeFileName);

    return this.http.post<any>(this.apiUrl, formData);
  }

  delete(path: string): Observable<any> {
    // Кодируем путь для URL
    const encodedPath = encodeURIComponent(path);
    return this.http.delete<any>(`${this.apiUrl}?path=${encodedPath}`);
  }

  private sanitizeFileName(name: string): string {
    // Удаляем небезопасные символы
    return name.replace(/[#%&{}\\<>*?/$!'":@+`|=]/g, '')
      .replace(/\s+/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
