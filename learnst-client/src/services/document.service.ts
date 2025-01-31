import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Marked, marked } from 'marked';
import hljs from 'highlight.js';
import { markedHighlight } from "marked-highlight";

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private marked: Marked;

  constructor(private http: HttpClient) {
    // Инициализация Marked с подсветкой синтаксиса
    this.marked = new Marked(
      markedHighlight({
        langPrefix: 'hljs language-', // Префикс для классов языка
        highlight: (code: string, lang: string) => {
          const validLanguage = hljs.getLanguage(lang) ? lang : 'plaintext';
          return hljs.highlight(code, { language: validLanguage }).value;
        },
      })
    );
  }

  // Метод для загрузки Markdown-файла
  getMarkdown(url: string): Observable<string> {
    return this.http.get(url, { responseType: 'text' });
  }

  // Метод для преобразования Markdown в HTML
  markdownToHtml(markdown: string): string | Promise<string> {
    return this.marked.parse(markdown);
  }

  // Метод для открытия файла в веб-офисе от Microsoft
  openFileInOffice(fileUrl: string): void {
    window.open(`${environment.officeBaseUrl}href=${encodeURIComponent(fileUrl)}`, '_blank');
  }
}
