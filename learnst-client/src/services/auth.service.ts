import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {Observable, BehaviorSubject, of} from 'rxjs';
import {tap, catchError, map, switchMap} from 'rxjs/operators';
import {environment} from '../environments/environment';
import {UserDao} from '../models/UserDao';
import {UsersService} from './users.service';
import {StoredUser} from '../models/StoredUser';
import {Role} from '../enums/Role';
import {User} from '../models/User';
import {AES, enc} from 'crypto-js';
import {toSignal} from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly ACCOUNTS_KEY = 'user_accounts';
  private readonly ENCRYPTION_KEY = environment.encryptionKey;

  private accountsSubject = new BehaviorSubject<StoredUser[]>([]);
  private currentUserSubject = new BehaviorSubject<UserDao | null>(null);
  public accounts = toSignal(this.accountsSubject);

  private router = inject(Router);
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/sessions`;

  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private usersService: UsersService) {
    this.initializeAuthState();
  }

  login(login: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/auth`, {login, password})
      .pipe(
        tap(({token}) => this.handleAuthenticationSuccess(token)),
        catchError(error => {
          console.error('Login error:', error);
          throw error;
        })
      );
  }

  logout(fullLogout = false): void {
    if (fullLogout) {
      this.clearAuthData();
      localStorage.removeItem(this.ACCOUNTS_KEY);
      this.accountsSubject.next([]);
      this.router.navigate(['/login']);
    } else
      this.clearAuthData();
  }

  switchAccount(accountId: string): void {
    const accounts = this.accountsSubject.value.map(acc => ({
      ...acc,
      isCurrent: acc.id === accountId
    }));

    const newCurrent = accounts.find(acc => acc.isCurrent);
    if (newCurrent) {
      this.saveAccounts(accounts);
      this.setCurrentUser(newCurrent);
      localStorage.setItem(this.TOKEN_KEY, newCurrent.accessToken);
    }
  }

  removeAccount(accountId: string): void {
    const filteredAccounts = this.accountsSubject.value
      .filter(acc => acc.id !== accountId);
    this.saveAccounts(filteredAccounts);

    if (this.currentUserSubject.value?.openid === accountId) {
      this.clearAuthData();
    }
  }

  /**
   * Получение полных данных пользователя.
   * @returns Observable<User | null> - Полные данные пользователя или null, если пользователь не авторизован.
   */
  getUser(): Observable<User | null> {
    return this.currentUser$.pipe(
      switchMap(userDao => {
        if (!userDao?.openid) return of(null);
        return this.usersService.getUserById(userDao.openid);
      }),
      tap(user => {
        if (user) this.updateAccountInfo(user);
      }),
      catchError(() => of(null))
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
      openid: user.id!,
      username: user.username,
      role: user.role
    });
  }

  isUserAuthorized(): Observable<boolean> {
    return this.currentUser$.pipe(map(user => !!user));
  }

  isAdmin(): Observable<boolean> {
    return this.currentUser$.pipe(map(user => user?.role === Role.Admin));
  }

  private updateAccountInfo(user: User): void {
    const accounts: StoredUser[] = this.accountsSubject.value.map(a => {
      if (a.id === user.id)
        return {...a, username: user.username, avatarUrl: user.avatarUrl};
      return a;
    });
    this.saveAccounts(accounts);
  }

  private initializeAuthState(): void {
    this.loadAccounts();
    this.handleOAuthCallback();
    this.restoreCurrentSession();
  }

  private encryptData(data: string): string {
    return AES.encrypt(data, this.ENCRYPTION_KEY).toString();
  }

  private decryptData(data: string): string {
    const bytes = AES.decrypt(data, this.ENCRYPTION_KEY);
    return bytes.toString(enc.Utf8);
  }

  private restoreCurrentSession(): void {
    const encryptedToken = localStorage.getItem(this.TOKEN_KEY);
    if (!encryptedToken) return;

    try {
      const decryptedToken = this.decryptData(encryptedToken);
      const payload = this.decodeToken(decryptedToken);

      if (payload) {
        const accounts = this.accountsSubject.value;
        const account = accounts.find(acc => acc.id === payload.openid);

        if (account) {
          this.setCurrentUser(account);
        }
      }
    } catch (error) {
      console.error('Ошибка восстановления сессии:', error);
      this.clearAuthData();
    }
  }

  private handleAuthenticationSuccess(token: string): void {
    const encryptedToken = this.encryptData(token);
    const payload = this.decodeToken(token);

    if (!payload) return;

    const accounts = this.accountsSubject.value;
    const existingAccount = accounts.find(acc => acc.id === payload.openid);

    // Сбрасываем isCurrent для всех аккаунтов
    const updatedAccounts = accounts.map(acc => ({
      ...acc,
      isCurrent: false
    }));

    let newAccount: StoredUser;

    if (existingAccount) {
      // Обновляем существующий аккаунт
      newAccount = {
        ...existingAccount,
        accessToken: encryptedToken,
        isCurrent: true,
        lastLogin: new Date()
      };

      // Заменяем существующий аккаунт в updatedAccounts
      const index = updatedAccounts.findIndex(acc => acc.id === existingAccount.id);
      if (index !== -1)
        updatedAccounts[index] = newAccount;
      else
        updatedAccounts.push(newAccount);
    } else {
      // Создаем новый аккаунт
      newAccount = this.createStoredUser(payload, encryptedToken);
      updatedAccounts.push(newAccount);
    }

    this.saveAccounts(updatedAccounts);
    this.setCurrentUser(newAccount);
    localStorage.setItem(this.TOKEN_KEY, encryptedToken);
  }

  private createStoredUser(payload: any, encryptedToken: string): StoredUser {
    return {
      id: payload.openid,
      username: payload.username,
      avatarUrl: payload.avatarUrl || '/assets/default-avatar.png',
      accessToken: encryptedToken,
      isCurrent: true,
      lastLogin: new Date()
    };
  }

  private loadAccounts(): void {
    const encrypted = localStorage.getItem(this.ACCOUNTS_KEY);
    if (!encrypted) return;

    try {
      const decrypted = this.decryptData(encrypted);
      const accounts: StoredUser[] = JSON.parse(decrypted);
      const current = accounts.find(acc => acc.isCurrent);

      this.accountsSubject.next(accounts);
      if (current) {
        this.setCurrentUser(current);
        localStorage.setItem(this.TOKEN_KEY, current.accessToken);
      }
    } catch (error) {
      console.error('Не удалось загрузить аккаунты:', error);
    }
  }

  private saveAccounts(accounts: StoredUser[]): void {
    const encrypted = this.encryptData(JSON.stringify(accounts));
    localStorage.setItem(this.ACCOUNTS_KEY, encrypted);
    this.accountsSubject.next(accounts);
  }

  private decodeToken(token: string): any | null {
    try {
      // Заменяем URL-safe символы и добавляем padding
      const base64Url = token.split('.')[1];
      const base64 = base64Url
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const paddedBase64 = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');

      const payload = JSON.parse(decodeURIComponent(atob(paddedBase64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')));

      if (payload?.openid && payload?.username && payload?.role) {
        return payload;
      }
      return null;
    } catch (error) {
      console.error('Ошибка обработки токена:', error);
      return null;
    }
  }

  private setCurrentUser(account: StoredUser): void {
    const decryptedToken = this.decryptData(account.accessToken);
    const payload = this.decodeToken(decryptedToken);

    if (payload) {
      this.currentUserSubject.next({
        openid: payload.openid,
        username: payload.username,
        role: payload.role
      });
    }
  }

  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
  }

  private getTokenFromUrl(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
  }

  private handleOAuthCallback(): void {
    const token = this.getTokenFromUrl();
    if (!token) return;
    this.handleAuthenticationSuccess(token);
    this.router.navigate(['/']); // Перенаправляем на главную после успешной авторизации
  }
}
