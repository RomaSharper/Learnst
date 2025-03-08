import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { lastValueFrom } from 'rxjs';
import { InspectableDirective } from '../../directives/inspectable.directive';
import { UserSubscription } from '../../models/UserSubscription';
import { RoundPipe } from '../../pipes/round.pipe';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { SubscriptionService } from '../../services/subscription.service';

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
  currentSubscription = signal<UserSubscription | null>(null);
  subscriptionPlans = this.subService.getSubscriptionOptions();

  async ngOnInit() {
    await this.loadSubscription();
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

  async purchaseSubscription() {
    const duration = this.selectedPlan();
    this.authService.getUser().subscribe(async user => {
      if (!duration || !user?.id) return;

      try {
        this.loading.set(true);
        const { confirmationUrl } = await lastValueFrom(
          this.subService.createSubscriptionPayment(duration, user.id)
        );
        window.location.href = confirmationUrl;
      } catch (error) {
        this.alertService.showSnackBar('Ошибка оплаты');
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
}
