import { Component, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { SubscriptionService } from '../../services/subscription.service';
import { UserSubscription } from '../../models/UserSubscription';
import { AlertService } from '../../services/alert.service';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { DatePipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import { lastValueFrom } from 'rxjs';
import { RoundPipe } from '../../pipes/round.pipe';

@Component({
  selector: 'app-subscription',
  styleUrls: ['./subscription.component.scss'],
  templateUrl: './subscription.component.html',
  imports: [
    DatePipe,
    RoundPipe,
    MatListModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ]
})
export class SubscriptionsComponent {
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  isLoading = signal(false);
  subService = inject(SubscriptionService);
  selectedPlan = signal<number | null>(null);
  currentSubscription = signal<UserSubscription | null>(null);
  subscriptionPlans = this.subService.getSubscriptionOptions();

  constructor() {
    effect(() => {
      const user = toSignal(this.authService.getUser());
      if (user) this.loadSubscription(user()?.id!);
    });
  }

  private async loadSubscription(userId: string) {
    this.isLoading.set(true);
    try {
      const sub = await lastValueFrom(
        this.subService.getUserSubscriptions(userId)
      );
      this.currentSubscription.set(sub);
    } catch (error) {
      this.alertService.showSnackBar('Ошибка загрузки подписки');
    }
    this.isLoading.set(false);
  }

  async purchaseSubscription() {
    const duration = this.selectedPlan();
    const userId = toSignal(this.authService.getUser())()?.id;

    if (!duration || !userId) return;

    this.isLoading.set(true);
    try {
      const { confirmationUrl } = await lastValueFrom(
        this.subService.createSubscriptionPayment(duration, userId)
      );
      window.location.href = confirmationUrl;
    } catch (error) {
      this.alertService.showSnackBar('Ошибка оплаты');
      this.isLoading.set(false);
    }
  }

  // Добавляем метод для вычисления оставшихся дней
  getDaysRemaining(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
  }

  // Исправляем выбор плана
  selectPlan(duration: number) {
    this.selectedPlan.set(duration);
  }
}
