import {inject, Injectable} from '@angular/core';
import {
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  IHttpConnectionOptions,
  IRetryPolicy,
  RetryContext
} from '@microsoft/signalr';
import {ReplaySubject, Subject} from 'rxjs';
import {Status} from '../enums/Status';
import {environment} from '../environments/environment';
import {LogService} from './log.service';

@Injectable({providedIn: 'root'})
export class SignalRService {
  private logService = inject(LogService);
  private themeUpdates = new Subject<string>();
  private connectionSubject = new ReplaySubject<HubConnection>(1);
  private statusUpdates = new Subject<{ userId: string, status: Status }>();
  private retryPolicy: IRetryPolicy = {
    nextRetryDelayInMilliseconds(retryContext: RetryContext): number {
      return Math.min(retryContext.previousRetryCount * 2000, 10000);
    }
  };

  private defaultHttpOptions: IHttpConnectionOptions = {
    withCredentials: true,
    skipNegotiation: false,
    transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling
  };

  private connection = new HubConnectionBuilder()
    .withUrl(`${environment.apiBaseUrl}/commonhub`, this.defaultHttpOptions)
    .withAutomaticReconnect(this.retryPolicy)
    .build();

  constructor() {
    this.initializeConnection();
  }

  onStatusUpdate() {
    return this.statusUpdates.asObservable();
  }

  onThemeUpdate() {
    return this.themeUpdates.asObservable();
  }

  async invoke(methodName: string, ...args: any[]): Promise<void> {
    if (!this.connection)
      throw new Error('Подключение к SignalR не инициализировано');

    if (this.connection.state !== HubConnectionState.Connected)
      await this.waitForConnection();

    try {
      await this.connection.invoke(methodName, ...args);
    } catch (err) {
      if (!(err instanceof Error)) return;
      this.logService.errorWithData('Ошибка при вызове метода SignalR:', err);
      throw new Error('Ошибка на сервере. Пожалуйста, попробуйте позже.');
    }
  }

  private initializeConnection(): void {
    this.connection.start()
      .then(() => {
        this.logService.log('Подключение к SignalR установлено');
        this.connectionSubject.next(this.connection!);
      })
      .catch(err => this.logService.errorWithData('Ошибка при подключении к SignalR:', err));

    // Подписка на события
    this.connection.on('ReceiveStatus', (userId: string, status: Status) => {
      this.statusUpdates.next({userId, status});
    });

    this.connection.on('ReceiveThemeUpdate', (themeId: string) => {
      this.themeUpdates.next(themeId);
    });
  }

  private async waitForConnection(): Promise<void> {
    return new Promise((resolve, _reject) => {
      this.connection!.onreconnected(() => resolve());
      if (this.connection!.state === HubConnectionState.Connected)
        resolve();
    });
  }
}
