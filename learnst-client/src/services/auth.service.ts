import {Injectable, inject, OnInit} from '@angular/core';
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
import {UserStatusService} from './user.status.service';
import {Status} from '../enums/Status';
import {LogService} from './log.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private logService = inject(LogService);
  private usersService = inject(UsersService);
  private userStatusService = inject(UserStatusService);
  private accountsSubject = new BehaviorSubject<StoredUser[]>([]);
  private currentUserSubject = new BehaviorSubject<UserDao | null>(null);

  private readonly TOKEN_KEY = 'auth_token';
  private readonly ACCOUNTS_KEY = 'user_accounts';
  private readonly ENCRYPTION_KEY = environment.encryptionKey;
  private readonly API_URL = `${environment.apiBaseUrl}/sessions`;

  public accounts = toSignal(this.accountsSubject);
  public currentUser$ = this.currentUserSubject.asObservable();

  ngOnInit() {
    this.initializeAuthState();
  }

  login(login: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.API_URL}/auth`, {login, password})
      .pipe(
        tap(({token}) => this.handleAuthenticationSuccess(token)),
        catchError(error => {
          this.logService.errorWithData('Ошибка входа:', error);
          throw error;
        })
      );
  }

  logout(fullLogout = false): void {
    if (fullLogout) {
      // Сохраняем ID всех аккаунтов перед очисткой
      const accounts = this.accountsSubject.value;
      const accountIds = accounts.map(acc => acc.id);

      // Очищаем данные
      this.clearAuthData();
      localStorage.removeItem(this.ACCOUNTS_KEY);
      this.accountsSubject.next([]);
      this.router.navigate(['/login']);

      // Обновляем статус для всех аккаунтов
      accountIds.forEach(id => this.userStatusService.updateStatus(Status.Offline, id));
    } else {
      // Сохраняем ID текущего пользователя перед очисткой
      const currentUserId = this.currentUserSubject.value?.openid;
      this.clearAuthData();

      // Обновляем статус только текущего пользователя
      if (currentUserId)
        this.userStatusService.updateStatus(Status.Offline, currentUserId);
    }
  }

  switchAccount(accountId: string): void {
    const accounts = this.accountsSubject.value.map(acc => ({
      ...acc,
      isCurrent: acc.id === accountId
    }));

    const previousCurrent = this.accountsSubject.value.find(acc => acc.isCurrent);
    const newCurrent = accounts.find(acc => acc.isCurrent);

    if (previousCurrent)
      // Устанавливаем статус Offline для предыдущего аккаунта
      this.userStatusService.updateStatus(Status.Offline, previousCurrent.id);

    if (newCurrent) {
      this.saveAccounts(accounts);
      this.setCurrentUser(newCurrent);
      localStorage.setItem(this.TOKEN_KEY, newCurrent.accessToken);

      // Устанавливаем статус Online для нового аккаунта
      this.userStatusService.updateStatus(Status.Online, newCurrent.id);
    }
  }

  removeAccount(accountId: string): void {
    const filteredAccounts = this.accountsSubject.value
      .filter(acc => acc.id !== accountId);
    this.saveAccounts(filteredAccounts);

    if (this.currentUserSubject.value?.openid === accountId)
      this.clearAuthData();
  }

  getUser(): Observable<User | null> {
    return this.currentUser$.pipe(
      switchMap(userDao => userDao?.openid ? this.usersService.getUserById(userDao.openid) : of(null)),
      tap(user => {
        if (user) this.updateAccountInfo(user);
      }),
      catchError(() => of(null))
    );
  }

  setUser(user: User): void {
    if (!user) {
      this.currentUserSubject.next(null);
      return;
    }

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
    const accounts: StoredUser[] = this.accountsSubject.value.map(a => a.id === user.id
      ? { ...a, username: user.username, avatarUrl: user.avatarUrl }
      : a);
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

      if (!payload) return;
      const accounts = this.accountsSubject.value;
      const account = accounts.find(acc => acc.id === payload.openid);

      if (!account) return;
      this.setCurrentUser(account);
      localStorage.setItem(this.TOKEN_KEY, account.accessToken);
      this.userStatusService.updateStatus(Status.Online, account.id);
    } catch (error) {
      if (!(error instanceof Error)) return;
      this.logService.errorWithData('Ошибка восстановления сессии:', error);
      this.clearAuthData();
    }
  }

  private handleAuthenticationSuccess(token: string): void {
    const encryptedToken = this.encryptData(token);
    const payload = this.decodeToken(token);

    if (!payload) return;

    const accounts = this.accountsSubject.value;
    const previousCurrent = accounts.find(acc => acc.isCurrent); // Находим предыдущий текущий аккаунт
    const existingAccount = accounts.find(acc => acc.id === payload.openid);

    const updatedAccounts: StoredUser[] = accounts.map(acc => ({
      ...acc,
      isCurrent: false
    }));

    let newAccount: StoredUser;

    if (existingAccount) {
      newAccount = {
        ...existingAccount,
        accessToken: encryptedToken,
        isCurrent: true,
        lastLogin: new Date()
      };

      const index = updatedAccounts.findIndex(acc => acc.id === existingAccount.id);
      if (index !== -1) updatedAccounts[index] = newAccount;
      else updatedAccounts.push(newAccount);
    } else {
      newAccount = this.createStoredUser(payload, encryptedToken);
      updatedAccounts.push(newAccount);
    }

    // Обновляем статусы
    if (previousCurrent) this.userStatusService.updateStatus(Status.Offline, previousCurrent.id);
    this.userStatusService.updateStatus(Status.Online, newAccount.id);

    this.saveAccounts(updatedAccounts);
    this.setCurrentUser(newAccount);
    localStorage.setItem(this.TOKEN_KEY, encryptedToken);
  }

  private createStoredUser(payload: any, encryptedToken: string): StoredUser {
    return {
      id: payload.openid,
      username: payload.username,
      avatarUrl: payload.avatarUrl || '/assets/icons/user-192x192.png',
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

      if (!current) return;
      this.setCurrentUser(current);
      localStorage.setItem(this.TOKEN_KEY, current.accessToken);
    } catch (error) {
      if (!(error instanceof Error)) return;
      this.logService.errorWithData('Не удалось загрузить аккаунты:', error);
    }
  }

  private saveAccounts(accounts: StoredUser[]): void {
    const encrypted = this.encryptData(JSON.stringify(accounts));
    localStorage.setItem(this.ACCOUNTS_KEY, encrypted);
    this.accountsSubject.next(accounts);
  }

  private decodeToken(token: string): any | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const paddedBase64 = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');

      const payload = JSON.parse(decodeURIComponent(atob(paddedBase64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')));

      return payload?.openid && payload?.username && payload?.role ? payload : null;
    } catch (error) {
      if (!(error instanceof Error)) return;
      this.logService.errorWithData('Ошибка обработки токена:', error);
      return null;
    }
  }

  private setCurrentUser(account: StoredUser): void {
    const decryptedToken = this.decryptData(account.accessToken);
    const payload = this.decodeToken(decryptedToken);

    if (!payload) return;
    this.currentUserSubject.next({
      openid: payload.openid,
      username: payload.username,
      role: payload.role
    });
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
    this.router.navigate(['/']);
  }
}
