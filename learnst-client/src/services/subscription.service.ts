import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import { UserSubscription } from '../models/UserSubscription';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  readonly price = environment.subscriptionPrice;
  private apiUrl = `${environment.apiBaseUrl}/payment`;

  constructor(private http: HttpClient) {}

  getSubscriptionOptions(): { duration: number, label: string, discount: number }[] {
    return [
      { duration: 1, label: '1 месяц', discount: 0 },
      { duration: 3, label: '3 месяца', discount: 10 },
      { duration: 12, label: '1 год', discount: 20 }
    ];
  }

  calculatePrice(duration: number): number {
    const base = this.price * duration;
    return duration === 3 ? base * 0.9 :
           duration === 12 ? base * 0.8 : base;
  }

  getUserSubscriptions(userId: string): Observable<UserSubscription> {
    return this.http.get<UserSubscription>(
      `${this.apiUrl}/active?userId=${userId}`
    );
  }

  createSubscriptionPayment(duration: number, userId: string): Observable<{ confirmationUrl: string }> {
    return this.http.post<{ confirmationUrl: string }>(
      `${this.apiUrl}/create-subscription`,
      { duration, userId }
    );
  }
}
