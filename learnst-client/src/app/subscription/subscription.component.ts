import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { lastValueFrom, Observable } from 'rxjs';
import { InspectableDirective } from '../../directives/inspectable.directive';
import { UserSubscription } from '../../models/UserSubscription';
import { RoundPipe } from '../../pipes/round.pipe';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { SubscriptionService } from '../../services/subscription.service';
import { RuDatePipe } from '../../pipes/ru.date.pipe';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { QrDialogComponent } from '../qr-dialog/qr-dialog.component';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-subscription',
  styleUrls: ['./subscription.component.scss'],
  templateUrl: './subscription.component.html',
  imports: [
    RoundPipe,
    RuDatePipe,
    MatIconModule,
    MatListModule,
    MatCardModule,
    MatButtonModule,
    InspectableDirective,
    MatProgressSpinnerModule
  ]
})
export class SubscriptionsComponent implements OnInit {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private subService = inject(SubscriptionService);
  private readonly yookassaShopId = environment.yookassaShopId;
  private readonly yookassaSecretKey = environment.yookassaSecretKey;

  loading = signal(false);
  selectedPlan = signal<number | null>(null);
  currentSubscription = signal<UserSubscription | null>(null);
  subscriptionPlans = this.subService.getSubscriptionOptions();
  paymentStatus = signal<'pending' | 'success' | 'failed' | 'qr' | null>(null);

  async ngOnInit() {
    await this.loadSubscription();
  }

  createPayment(duration: number, userId: string): Observable<any> {
    const payload = {
      amount: {
        value: this.calculatePrice(duration),
        currency: 'RUB'
      },
      confirmation: {
        type: 'qr' // Или 'redirect' для перенаправления
      },
      capture: true,
      description: `Подписка на ${duration} месяцев`,
      metadata: {
        userId,
        duration
      }
    };

    return this.http.post('https://api.yookassa.ru/v3/payments', payload, {
      headers: {
        'Authorization': `Basic ${btoa(`${this.yookassaShopId}:${this.yookassaSecretKey}`)}`,
        'Idempotence-Key': this.generateIdempotenceKey()
      }
    });
  }

  private generateIdempotenceKey(): string {
    return Math.random().toString(36).substring(2) + Date.now();
  }

  private async loadSubscription() {
    this.authService.getUser().subscribe(async user => {
      if (!user?.id) return;

      this.loading.set(true);
      try {
        const sub = await lastValueFrom(this.subService.getUserSubscriptions(user.id));
        this.currentSubscription.set(sub);
      } catch (error) {
        this.alertService.showSnackBar('Ошибка загрузки подписки');
      } finally {
        this.loading.set(false);
      }
    });
  }

  getDaysRemaining(endDate?: string): number {
    if (!endDate) return 0;

    const end = new Date(endDate);
    if (isNaN(end.getTime())) return 0;

    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  }

  selectPlan(duration: number) {
    this.selectedPlan.set(duration);
  }

  calculatePrice(duration: number): number {
    return this.subService.calculatePrice(duration);
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'succeeded': return 'Успешно';
      case 'canceled': return 'Отменён';
      case 'pending': return 'В обработке';
      default: return 'Неизвестно';
    }
  }

  async purchaseSubscription() {
    const duration = this.selectedPlan();
    if (!duration) return;

    this.loading.set(true);

    try {
      const user = await lastValueFrom(this.authService.getUser());
      if (!user?.id) throw new Error('Пользователь не авторизован');

      const response = await lastValueFrom(
        this.subService.createSubscriptionPayment(duration, user.id)
      );

      // Устанавливаем статус для отображения QR
      this.paymentStatus.set('qr');

      // Открываем диалог с QR-кодом
      const dialogRef = this.dialog.open(QrDialogComponent, {
        data: { url: response.qrUrl || response.confirmationUrl },
        disableClose: true
      });

      // При закрытии диалога
      dialogRef.afterClosed().subscribe(() => {
        this.paymentStatus.set(null);
      });

      // Проверяем статус платежа
      const checkInterval = setInterval(() => {
        this.subService.checkPaymentStatus(response.paymentId).subscribe({
          next: status => {
            console.log(status);
            if (status === 'succeeded') {
              clearInterval(checkInterval);
              this.paymentStatus.set('success');
              this.loadSubscription();
              dialogRef.close();
            }
          },
          error: (err) => {
            console.error(err);
            this.paymentStatus.set('failed');
            dialogRef.close();
          }
        });
      }, 10000);

    } catch (error) {
      this.paymentStatus.set('failed');
    } finally {
      this.loading.set(false);
    }
  }
}
