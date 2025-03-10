import { Component, OnInit, inject, signal } from '@angular/core';
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
import { CurrencyPipe } from '@angular/common';
import { PaymentHistoryItem } from '../../models/PaymentHistoryItem';
import { PaymentStatus } from '../../models/PaymentStatus';

@Component({
  selector: 'app-subscription',
  styleUrls: ['./subscription.component.scss'],
  templateUrl: './subscription.component.html',
  imports: [
    RoundPipe,
    RuDatePipe,
    CurrencyPipe,
    MatIconModule,
    MatListModule,
    MatCardModule,
    MatButtonModule,
    InspectableDirective,
    MatProgressSpinnerModule
  ]
})
export class SubscriptionsComponent implements OnInit {
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private subService = inject(SubscriptionService);

  loading = signal(false);
  selectedPlan = signal<number | null>(null);
  paymentHistory = signal<PaymentHistoryItem[]>([]);
  currentSubscription = signal<UserSubscription | null>(null);
  subscriptionPlans = this.subService.getSubscriptionOptions();
  paymentStatus = signal<'pending' | 'success' | 'failed' | null>(null);

  async ngOnInit() {
    await this.loadSubscription();
    await this.loadPaymentHistory();
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
    switch(status) {
      case 'succeeded': return 'Успешно';
      case 'canceled': return 'Отменён';
      case 'pending': return 'В обработке';
      default: return 'Неизвестно';
    }
  }

  private async loadPaymentHistory() {
    this.authService.getUser().subscribe(async user => {
      if (!user?.id) return;

      try {
        const history = await lastValueFrom(
          this.subService.getPaymentHistory(user.id)
        );
        this.paymentHistory.set(history);
      } catch (error) {
        this.alertService.showSnackBar('Ошибка загрузки истории платежей');
      }
    });
  }

  async purchaseSubscription() {
    const duration = this.selectedPlan();
    this.authService.getUser().subscribe(async user => {
      if (!duration || !user?.id) return;

      try {
        this.loading.set(true);
        this.paymentStatus.set('pending');

        const response = await lastValueFrom(
          this.subService.createSubscriptionPayment(duration, user.id)
        );

        // Добавляем проверку paymentId
        if (!response.paymentId) {
          throw new Error('Payment ID not received');
        }

        const checkStatus = setInterval(async () => {
          const status = await lastValueFrom(
            this.subService.checkPaymentStatus(response.paymentId)
          );

          if (status === 'succeeded') {
            clearInterval(checkStatus);
            this.paymentStatus.set('success');
            await this.loadSubscription();
          } else if (status === 'canceled') {
            clearInterval(checkStatus);
            this.paymentStatus.set('failed');
          }
        }, 5000);

        window.location.href = response.confirmationUrl;
      } catch (error) {
        this.paymentStatus.set('failed');
        this.alertService.showSnackBar('Ошибка оплаты');
      } finally {
        this.loading.set(false);
      }
    });
  }
}
