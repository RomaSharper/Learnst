import { Injectable, DestroyRef, inject } from '@angular/core';
import { HubConnection, HubConnectionBuilder, IRetryPolicy, RetryContext } from '@microsoft/signalr';
import { ReplaySubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private destroyRef = inject(DestroyRef);
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
      .withUrl(hubUrl, { withCredentials: true })
      .withAutomaticReconnect(this.retryPolicy)
      .build();

    this.connections.set(hubUrl, connection);
    this.connectionSubjects.set(hubUrl, subject);

    connection.start()
      .then(() => subject.next(connection))
      .catch(err => subject.error(err));

    connection.onreconnected(() => subject.next(connection));
    connection.onclose(err => subject.error(err));

    return subject;
  }

  invoke<T>(hubUrl: string, methodName: string, ...args: any[]): Promise<T> {
    return this.connections.get(hubUrl)?.invoke<T>(methodName, ...args)
      ?? Promise.reject('Connection not initialized');
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
}
