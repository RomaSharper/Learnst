import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { environment } from '../environments/environment';
import { Lesson } from '../models/Lesson';
import { UserLesson } from '../models/UserLesson';

@Injectable({
  providedIn: 'root'
})
export class LessonsService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  getLessons(topicId: string): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/topics/${topicId}/lessons`);
  }

  getLessonById(lessonId: string): Observable<Lesson> {
    return this.http.get<Lesson>(`${this.apiUrl}/lessons/${lessonId}`);
  }

  createLesson(lesson: Lesson): Observable<Lesson> {
    return this.http.post<Lesson>(`${this.apiUrl}/lessons`, lesson);
  }

  updateLesson(lessonId: string, lesson: Lesson): Observable<Lesson> {
    return this.http.put<Lesson>(`${this.apiUrl}/lessons/${lessonId}`, lesson);
  }

  deleteLesson(lessonId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/lessons/${lessonId}`);
  }

  // Новые методы для работы с UserLesson
  getUserLessonsByUserId(userId: string): Observable<UserLesson[]> {
    return this.http.get<UserLesson[]>(`${this.apiUrl}/userLessons/user/${userId}`);
  }

  getUserLesson(userId: string, lessonId: string): Observable<UserLesson | null> {
    return this.http.get<UserLesson>(`${this.apiUrl}/userLessons/${userId}/${lessonId}`).pipe(
      catchError(error => {
        if (error.status === 404)
          return of(null);
        throw error; // Если произошла другая ошибка, пробрасываем её дальше
      })
    );
  }

  createUserLesson(userLesson: UserLesson): Observable<UserLesson> {
    return this.http.post<UserLesson>(`${this.apiUrl}/userLessons`, userLesson);
  }

  updateUserLesson(userId: string, lessonId: string, userLesson: UserLesson): Observable<UserLesson> {
    return this.http.put<UserLesson>(`${this.apiUrl}/userLessons/${userId}/${lessonId}`, userLesson);
  }

  updateLessonTestStatus(lessonId: string, isTestEnded: boolean): Observable<Lesson> {
    return this.http.put<Lesson>(`${this.apiUrl}/lessons/${lessonId}/test-status`, { isTestEnded });
  }

  deleteUserLesson(userId: string, lessonId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/userLessons/${userId}/${lessonId}`);
  }
}
