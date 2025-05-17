import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  log(message?: string | null, data?: any): void {
    const logMessage = this.toLogMessage(message);
    data ? console.log(logMessage, data) : console.log(logMessage);
  }

  warn(message?: string | null, data?: any): void {
    const logMessage = this.toLogMessage(message);
    data ? console.warn(logMessage, data) : console.warn(logMessage);
  }

  debug(message?: string | null, data?: any): void {
    const logMessage = this.toLogMessage(message);
    data ? console.debug(logMessage, data) : console.debug(logMessage);
  }

  error(error?: Error | null): void {
    const logMessage = this.toLogMessage(error?.message);
    console.error(logMessage);
  }

  errorWithData(message?: string | null, data?: Error | null): void {
    const logMessage = this.toLogMessage(message);
    data ? console.error(logMessage, data) : console.error(logMessage);
  }

  private toLogMessage(message?: string | null): string {
    return `[${new Date().toISOString()}] ${message || 'пустое сообщение'}`;
  }
}
