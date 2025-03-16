import { Injectable } from '@angular/core';
import { HttpTransportType, HubConnection, HubConnectionBuilder, HubConnectionState, IHttpConnectionOptions, IRetryPolicy, RetryContext } from '@microsoft/signalr';
import { ReplaySubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private connections: Map<string, HubConnection> = new Map();
  private connectionSubjects: Map<string, ReplaySubject<HubConnection>> = new Map();

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

  createConnection(hubUrl: string, customOptions: IHttpConnectionOptions = {}): ReplaySubject<HubConnection> {
    const normalizedUrl = this.normalizeUrl(hubUrl);

    if (this.connectionSubjects.has(normalizedUrl)) {
      return this.connectionSubjects.get(normalizedUrl)!;
    }

    const subject = new ReplaySubject<HubConnection>(1);
    const options = { ...this.defaultHttpOptions, ...customOptions };

    const connection = new HubConnectionBuilder()
      .withUrl(normalizedUrl, options)
      .withAutomaticReconnect(this.retryPolicy)
      .build();

    this.connections.set(normalizedUrl, connection);
    this.connectionSubjects.set(normalizedUrl, subject);

    connection.onreconnected(() => {
      subject.next(connection);
      console.log(`Reconnected to ${normalizedUrl}`);
    });

    connection.onclose(error => {
      if (error) {
        console.error(`Connection closed for ${normalizedUrl}: ${error}`);
        subject.error(error);
      }
      this.cleanupConnection(normalizedUrl);
      subject.complete();
    });

    this.startConnection(connection, subject);
    return subject;
  }

  on(hubUrl: string, eventName: string, callback: (...args: any[]) => void): void {
    const normalizedUrl = this.normalizeUrl(hubUrl);
    const connection = this.connections.get(normalizedUrl);
    connection?.on(eventName, callback);
  }

  off(hubUrl: string, eventName: string): void {
    const normalizedUrl = this.normalizeUrl(hubUrl);
    const connection = this.connections.get(normalizedUrl);
    connection?.off(eventName);
  }

  async invoke<T>(hubUrl: string, methodName: string, ...args: any[]): Promise<T> {
    const normalizedUrl = this.normalizeUrl(hubUrl);
    const connection = this.connections.get(normalizedUrl);

    if (!connection) {
      throw new Error(`Connection for ${normalizedUrl} not found`);
    }

    if (connection.state !== HubConnectionState.Connected) {
      await this.waitForConnection(connection);
    }

    return connection.invoke<T>(methodName, ...args);
  }

  private async startConnection(connection: HubConnection, subject: ReplaySubject<HubConnection>): Promise<void> {
    try {
      await connection.start();
      subject.next(connection);
      console.log(`Connected to ${connection.baseUrl}`);
    } catch (error) {
      console.error(`Connection error for ${connection.baseUrl}: ${error}`);
      subject.error(error);
      this.cleanupConnection(connection.baseUrl);
    }
  }

  private async waitForConnection(connection: HubConnection): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        connection.off('close');
        connection.off('reconnected');
        reject(new Error('Время подключения истекло.'));
      }, 5000);

      const successHandler = () => {
        clearTimeout(timeout);
        resolve();
      };

      connection.onreconnected = successHandler;
      connection.onclose = reject;

      if (connection.state === HubConnectionState.Connected) {
        successHandler();
      }
    });
  }

  private normalizeUrl(url: string): string {
    return url.toLowerCase().trim().replace(/\/+$/, '');
  }

  private cleanupConnection(normalizedUrl: string): void {
    this.connections.delete(normalizedUrl);
    this.connectionSubjects.delete(normalizedUrl);
  }
}
