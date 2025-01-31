import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket!: WebSocket;
  private messageSubject = new Subject<any>();

  constructor() {
    this.connect();
  }

  // Устанавливаем соединение с WebSocket-сервером
  private connect(): void {
    this.socket = new WebSocket('ws://your-backend-url/ws'); // Укажите URL вашего WebSocket-сервера

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.messageSubject.next(message); // Отправляем сообщение в поток
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
      setTimeout(() => this.connect(), 5000); // Переподключение через 5 секунд
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  // Получаем Observable для подписки на сообщения
  public getMessages(): Observable<any> {
    return this.messageSubject.asObservable();
  }

  // Отправляем сообщение на сервер
  public sendMessage(message: any): void {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not open');
    }
  }
}
