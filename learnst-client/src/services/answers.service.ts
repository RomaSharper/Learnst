import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from '../environments/environment';
import {UserAnswer} from '../models/UserAnswer';

@Injectable({
  providedIn: 'root'
})
export class AnswersService {
  private http = inject(HttpClient);

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
