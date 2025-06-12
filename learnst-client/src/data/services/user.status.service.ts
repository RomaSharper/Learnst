import {inject, Injectable} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {Status} from '../enums/Status';
import {SignalRService} from './signalr.service';
import {UsersService} from './users.service';
import {environment} from '../../env/environment';
import {lastValueFrom} from 'rxjs';
import {LogService} from './log.service';

@Injectable({
  providedIn: 'root'
})
export class UserStatusService {
  private activityTimeout?: any;
  private currentUserId?: string;
  private isWindowActive = true;
  private readonly INACTIVITY_TIMEOUT = 300000;

  private router = inject(Router);
  private logService = inject(LogService);
  private usersService = inject(UsersService);
  private signalRService = inject(SignalRService);

  initialize(userId: string): void {
    this.currentUserId = userId;
    this.setupActivityTracking();
    this.setupVisibilityChangeHandler();
  }

  async updateStatus(status: Status, userId?: string): Promise<void> {
    const targetUserId = userId || this.currentUserId;

    if (!targetUserId) {
      this.logService.errorWithData('Не установлен ID пользователя');
      return;
    }

    try {
      // Обновляем статус на сервере
      await lastValueFrom(this.usersService.updateStatus(targetUserId, status));

      // Уведомляем других клиентов через SignalR
      await this.signalRService.invoke('SendStatusUpdate', targetUserId, status);
    } catch (err) {
      // this.logService.errorWithData('Ошибка при обновлении статуса:', err);
    }
  }

  private setupActivityTracking(): void {
    const events = [
      'mousemove', 'keydown', 'scroll', 'click',
      'touchstart', 'touchmove', 'wheel'
    ];

    events.forEach(event => {
      window.addEventListener(event, this.handleActivity.bind(this), {passive: true});
    });

    this.trackNavigation();
    this.handleActivity(); // Инициализация таймера
  }

  private setupVisibilityChangeHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden')
        this.handleInactive();
      else
        this.handleActivity();
    });

    window.addEventListener('beforeunload', () => {
      if (this.currentUserId) {
        // Используем Beacon API для надежной отправки статуса
        navigator.sendBeacon(
          `${environment.apiBaseUrl}/users/${this.currentUserId}/status`,
          JSON.stringify({status: Status.Offline})
        );
      }
    });
  }

  private handleActivity(): void {
    if (!this.isWindowActive) {
      this.isWindowActive = true;
      this.updateStatus(Status.Online);
    }

    clearTimeout(this.activityTimeout);

    this.activityTimeout = setTimeout(() => {
      this.isWindowActive = false;
      this.updateStatus(Status.Offline);
    }, this.INACTIVITY_TIMEOUT);
  }

  private handleInactive(): void {
    clearTimeout(this.activityTimeout);
    this.updateStatus(Status.Offline);
  }

  private trackNavigation(): void {
    // Отслеживаем навигацию пользователя
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.updateStatus(event.url.startsWith('/activity/') || event.url.startsWith('/lesson/')
          ? Status.Activity
          : Status.Online);
    });
  }
}
