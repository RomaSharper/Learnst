import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Answer } from '../models/Answer';
import { UserAnswer } from '../models/UserAnswer';

@Injectable({
  providedIn: 'root'
})
export class AnswersService {
  private apiUrl = `${environment.apiBaseUrl}/answers`;

  constructor(private http: HttpClient) { }

  // getAnswersByQuestionId(questionId: string): Observable<Answer[]> {
  //   return this.http.get<Answer[]>(`${environment.apiBaseUrl}/questions/${questionId}/answers`);
  // }

  getAnswerById(answerId: number): Observable<Answer> {
    return this.http.get<Answer>(`${this.apiUrl}/${answerId}`);
  }

  createAnswer(answer: Answer): Observable<Answer> {
    return this.http.post<Answer>(this.apiUrl, answer);
  }

  updateAnswer(answerId: number, answer: Answer): Observable<Answer> {
    return this.http.put<Answer>(`${this.apiUrl}/${answerId}`, answer);
  }

  deleteAnswer(answerId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${answerId}`);
  }

  answerQuestion(userAnswer: UserAnswer): Observable<UserAnswer> {
    return this.http.post<UserAnswer>(`${environment.apiBaseUrl}/userAnswers`, userAnswer);
  }

  getUserAnswersByLesson(lessonId: string, userId: string): Observable<UserAnswer[]> {
    return this.http.get<UserAnswer[]>(`${environment.apiBaseUrl}/userAnswers/activity/${lessonId}/user/${userId}`);
  }

  getCorrectAnswersCountByActivity(activityId: string, userId: string): Observable<number> {
    return this.http.get<number>(`${environment.apiBaseUrl}/userAnswers/activity/${activityId}/user/${userId}/correct`);
  }

  getTotalQuestionsCountByActivity(activityId: string): Observable<number> {
    return this.http.get<number>(`${environment.apiBaseUrl}/questions/${activityId}/count`);
  }

  answerQuestions(userAnswers: UserAnswer[]): Observable<UserAnswer[]> {
    return this.http.post<UserAnswer[]>(`${environment.apiBaseUrl}/userAnswers/batch`, userAnswers);
  }
}
