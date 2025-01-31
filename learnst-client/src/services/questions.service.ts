import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Question } from '../models/Question';

@Injectable({
  providedIn: 'root'
})
export class QuestionsService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  getQuestions(lessonId: string): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/lessons/${lessonId}/questions`);
  }

  getQuestionById(questionId: string): Observable<Question> {
    return this.http.get<Question>(`${this.apiUrl}/questions/${questionId}`);
  }

  createQuestion(question: Question): Observable<Question> {
    return this.http.post<Question>(`${this.apiUrl}/questions`, question);
  }

  updateQuestion(questionId: string, question: Question): Observable<Question> {
    return this.http.put<Question>(`${this.apiUrl}/questions/${questionId}`, question);
  }

  deleteQuestion(questionId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/questions/${questionId}`);
  }
}
