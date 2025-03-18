import {Status} from "../enums/Status";
import {NavigationEnd, Router} from '@angular/router';
import {SignalRService} from "./signalr.service";
import {inject, Injectable} from '@angular/core';
import {UsersService} from './users.service';
import {AlertService} from './alert.service';

@Injectable({providedIn: 'root'})
export class UserStatusService {
  private userId?: string;
  private activityTimeout?: any;
  private router = inject(Router);
  private alertService = inject(AlertService);
  private usersService = inject(UsersService);
  private signalRService = inject(SignalRService);

  initialize(userId: string): void {
    this.userId = userId;
    this.router.events.subscribe((event: any) => {
      if (!(event instanceof NavigationEnd)) return;
      if (event.url.startsWith('/lesson/')) {
        this.updateStatus(Status.Activity);
      } else {
        this.updateStatus(Status.Online);
      }
    });

    this.resetActivityTimeout();
    window.addEventListener('mousemove', this.resetActivityTimeout.bind(this));
    window.addEventListener('keydown', this.resetActivityTimeout.bind(this));
  }

  async updateStatus(status: Status): Promise<void> {
    if (!this.userId) {
      console.error('User ID is not set');
      return;
    }

    console.log(`Updating status for user ${this.userId} to ${status}`); // Логирование
    try {
      await this.usersService.updateStatus(this.userId, status).toPromise();
      await this.signalRService.invoke('SendStatusUpdate', this.userId, status);
    } catch (err) {
      console.error('Ошибка при обновлении статуса:', err);
      this.alertService.showSnackBar('Не удалось обновить статус. Пожалуйста, попробуйте позже.');
    }
  }

  private resetActivityTimeout(): void {
    clearTimeout(this.activityTimeout);
    console.log('Resetting activity timeout'); // Логирование
    this.activityTimeout = setTimeout(() => {
      this.updateStatus(Status.Offline);
    }, 300000);
  }
}
