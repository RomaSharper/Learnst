import { Injectable } from '@angular/core';
import { HttpTransportType, HubConnection, HubConnectionBuilder, HubConnectionState, IRetryPolicy, RetryContext } from '@microsoft/signalr';
import { ReplaySubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private connections: Map<string, HubConnection> = new Map();
  private connectionSubjects: Map<string, ReplaySubject<HubConnection>> = new Map();

  private retryPolicy: IRetryPolicy = {
    nextRetryDelayInMilliseconds(retryContext: RetryContext) {
      return Math.min(retryContext.previousRetryCount * 2000, 10000);
    }
  };

  createConnection(hubUrl: string): ReplaySubject<HubConnection> {
    if (this.connectionSubjects.has(hubUrl)) {
      return this.connectionSubjects.get(hubUrl)!;
    }

    const subject = new ReplaySubject<HubConnection>(1);
    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        withCredentials: true,
        skipNegotiation: false,
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling
      })
      .withAutomaticReconnect(this.retryPolicy)
      .build();

    this.connections.set(hubUrl, connection);
    this.connectionSubjects.set(hubUrl, subject);

    connection.onreconnected(() => subject.next(connection));
    connection.onclose(err => {
      if (err) console.error(`Подключение завершилось ошибкой: ${err}`);
      subject.complete();
    });

    this.startConnection(connection, subject);

    return subject;
  }

  on(hubUrl: string, eventName: string, callback: (...args: any[]) => void): void {
    const connection = this.connections.get(hubUrl);
    connection?.on(eventName, callback);
  }

  off(hubUrl: string, eventName: string): void {
    const connection = this.connections.get(hubUrl);
    connection?.off(eventName);
  }

  destroyConnection(hubUrl: string): void {
    const connection = this.connections.get(hubUrl);
    connection?.stop();
    this.connections.delete(hubUrl);
    this.connectionSubjects.delete(hubUrl);
  }

  async invoke<T>(hubUrl: string, methodName: string, ...args: any[]): Promise<T> {
    const normalizedUrl = this.normalizeUrl(hubUrl);
    const connection = this.connections.get(normalizedUrl);

    if (!connection) {
      throw new Error('Подключение не было инициализировано');
    }

    if (connection.state !== HubConnectionState.Connected) {
      await this.waitForConnection(connection);
    }

    return connection.invoke<T>(methodName, ...args);
  }

  private normalizeUrl(url: string): string {
    return url.toLowerCase().trim();
  }

  private async waitForConnection(connection: HubConnection): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        connection.off('close');
        connection.off('reconnected');
        reject();
      }, 5000);

      const handler = () => {
        clearTimeout(timeout);
        connection.off('close', closeHandler);
        connection.off('reconnected', reconnectedHandler);
        if (connection.state === HubConnectionState.Connected) {
          resolve();
        } else {
          reject(new Error('Не удалось подключиться'));
        }
      };

      const closeHandler = (error?: Error) => {
        handler();
        reject(error || new Error('Ошибка подключения'));
      };

      const reconnectedHandler = () => {
        handler();
        resolve();
      };

      connection.onclose(closeHandler);
      connection.onreconnected(reconnectedHandler);

      if (connection.state === HubConnectionState.Connected) {
        resolve();
      }
    });
  }

  private async startConnection(connection: HubConnection, subject: ReplaySubject<HubConnection>) {
    try {
      await connection.start();
      subject.next(connection);
    } catch (err) {
      console.error('Ошибка подключения SignalR:', err);
      subject.error(err);
      this.destroyConnection(connection.baseUrl);
    }
  }
}
