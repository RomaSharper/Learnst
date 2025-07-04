import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {environment} from '../../env/environment';
import {Lesson} from '../models/Lesson';
import {UserLesson} from '../models/UserLesson';

@Injectable({
  providedIn: 'root'
})
export class LessonsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  getLessonById(lessonId: string): Observable<Lesson> {
    return this.http.get<Lesson>(`${this.apiUrl}/lessons/${lessonId}`);
  }

  // Новые методы для работы с UserLesson
  getUserLessonsByUserId(userId: string): Observable<UserLesson[]> {
    return this.http.get<UserLesson[]>(`${this.apiUrl}/userLessons/user/${userId}`);
  }

  getUserLesson(userId: string, lessonId: string): Observable<UserLesson | null> {
    return this.http.get<UserLesson>(`${this.apiUrl}/userLessons/${userId}/${lessonId}`).pipe(
      catchError(err => {
        console.log(err);
        if (err.status == 404)
          return of(null);
        throw err;
      })
    );
  }

  createUserLesson(userLesson: UserLesson): Observable<UserLesson> {
    return this.http.post<UserLesson>(`${this.apiUrl}/userLessons`, userLesson);
  }
}
