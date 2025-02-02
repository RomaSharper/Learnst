import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { Role } from '../enums/Role';
import { UserDao } from '../models/UserDao';
import { User } from '../models/User';
import { UsersService } from './users.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiBaseUrl}/sessions`;
  private oauth2Url = `${environment.apiBaseUrl}/oauth2`;
  private currentUserSubject: BehaviorSubject<UserDao | null> = new BehaviorSubject<UserDao | null>(null);
  public currentUser$: Observable<UserDao | null> = this.currentUserSubject.asObservable();

  constructor(
    private router: Router,
    private http: HttpClient,
    private usersService: UsersService
  ) {
    this.checkSession();
    this.handleOAuthCallback();
  }

  login(login: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/auth`, { login, password })
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token); // Сохраняем токен в localStorage
          this.decodeToken(response.token); // Декодируем токен и сохраняем данные пользователя
        }),
        catchError(error => {
          console.error('Login error:', error);
          throw error;
        })
      );
  }

  loginWithGoogle() {
    window.location.href = `${this.oauth2Url}/google/init`;
  }

  loginWithMicrosoft() {
    const clientId = 'YOUR_MICROSOFT_CLIENT_ID';
    const redirectUri = 'YOUR_REDIRECT_URI';
    const scope = 'openid email profile';

    window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${redirectUri}` +
      `&scope=${scope}` +
      `&response_mode=query`;
  }

  logout(): void {
    localStorage.removeItem('token'); // Удаляем токен
    this.currentUserSubject.next(null); // Очищаем состояние пользователя
    this.router.navigate(['/login']);
  }

  checkSession(): void {
    const token = localStorage.getItem('token');
    console.log('Токен из localStorage:', token); // Логируем токен

    if (token) {
      this.decodeToken(token);
      return;
    }

    console.warn('Токен отсутствует в localStorage');
    this.currentUserSubject.next(null);
  }

  /**
   * Получение полных данных пользователя.
   * @returns Observable<User | null> - Полные данные пользователя или null, если пользователь не авторизован.
   */
  getUser(): Observable<User | null> {
    return this.currentUser$.pipe(
      switchMap(userDao => {
        if (!userDao || !userDao.userId) {
          console.error('Пользователь не авторизован или userId отсутствует');
          return of(null);
        }
        return this.usersService.getUserById(userDao.userId);
      }),
      catchError(error => {
        console.error('Не удалось обработать данные:', error);
        return of(null);
      })
    );
  }

  /**
   * Установка текущего пользователя.
   * @param user - Полные данные пользователя.
   */
  setUser(user: User): void {
    if (!user) {
      this.currentUserSubject.next(null);
      return;
    }

    // Обновляем данные в BehaviorSubject
    this.currentUserSubject.next({
      userId: user.id!,
      username: user.username,
      role: user.role
    });
  }

  isUserAuthorized(): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => !!user)
    );
  }

  isAdmin(): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => user?.role === Role.Admin)
    );
  }

  private handleOAuthCallback(): void {
    const token = this.getTokenFromUrl();
    if (!token) return;
    localStorage.setItem('token', token);
    this.decodeToken(token);
    this.router.navigate(['/']); // Перенаправляем на главную после успешной авторизации
  }

  private getTokenFromUrl(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
  }

  private decodeToken(token: string): void {
    if (!token) {
      console.error('Токен отсутствует');
      this.currentUserSubject.next(null);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // Декодируем payload токена

      // Извлекаем данные из токена
      const userId = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
      const username = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
      const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

      if (!userId || !username || !role) {
        console.error('Токен не содержит необходимых данных');
        this.currentUserSubject.next(null);
        return;
      }

      // Обновляем данные в BehaviorSubject
      this.currentUserSubject.next({
        userId: userId,
        username: username,
        role: role
      });
    } catch (error) {
      console.error('Ошибка декодирования токена:', error);
      this.currentUserSubject.next(null);
    }
  }
}
