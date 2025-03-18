import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Status } from '../enums/Status';
import { SignalRService } from './signalr.service';
import { UsersService } from './users.service';
import { AlertService } from './alert.service';

@Injectable({ providedIn: 'root' })
export class UserStatusService {
  private currentUserId?: string;
  private activityTimeout?: any;
  private router = inject(Router);
  private alertService = inject(AlertService);
  private usersService = inject(UsersService);
  private signalRService = inject(SignalRService);

  initialize(userId: string): void {
    this.currentUserId = userId;

    // Отслеживание активности пользователя
    this.trackUserActivity();

    // Отслеживание закрытия вкладки или приложения
    this.trackWindowClose();

    // Отслеживание навигации
    this.trackNavigation();
  }

  private trackUserActivity(): void {
    window.addEventListener('mousemove', this.resetActivityTimeout.bind(this));
    window.addEventListener('keydown', this.resetActivityTimeout.bind(this));
    window.addEventListener('scroll', this.resetActivityTimeout.bind(this));
    window.addEventListener('click', this.resetActivityTimeout.bind(this));

    this.resetActivityTimeout();
  }

  private resetActivityTimeout(): void {
    clearTimeout(this.activityTimeout);

    // Устанавливаем таймер на 1 минуту
    this.activityTimeout = setTimeout(() => {
      this.updateStatus(Status.Offline);
    }, 60000); // 1 минута
  }

  private trackWindowClose(): void {
    // Отслеживаем закрытие вкладки или приложения
    window.addEventListener('beforeunload', () => {
      this.updateStatus(Status.Offline);
    });
  }

  private trackNavigation(): void {
    // Отслеживаем навигацию пользователя
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (event.url.startsWith('/activity/') || event.url.startsWith('/lesson/')) {
          this.updateStatus(Status.Activity);
        } else {
          this.updateStatus(Status.Online);
        }
      }
    });
  }

  async updateStatus(status: Status, userId?: string): Promise<void> {
    const targetUserId = userId || this.currentUserId;

    if (!targetUserId) {
      console.error('Не установлен ID пользователя');
      return;
    }

    try {
      // Обновляем статус на сервере
      await this.usersService.updateStatus(targetUserId, status).toPromise();

      // Уведомляем других клиентов через SignalR
      await this.signalRService.invoke('SendStatusUpdate', targetUserId, status);
    } catch (err) {
      console.error('Ошибка при обновлении статуса:', err);
      this.alertService.showSnackBar('Не удалось обновить статус. Пожалуйста, попробуйте позже.');
    }
  }
}
