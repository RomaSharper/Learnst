// noinspection JSUnusedGlobalSymbols

import {Injectable} from '@angular/core';

declare global {
  interface Window {
    turnstile: any;
  }
}

@Injectable({providedIn: 'root'})
export class TurnstileService {
  private widgetId: string | null = null;

  init(container: string, siteKey: string, callback: (token: string) => void) {
    this.widgetId = window.turnstile.render(`.${container}`, {
      sitekey: siteKey,
      'callback': (token: string) => callback(token),
      'error-callback': () => callback(''),
    });
  }

  reset() {
    if (this.widgetId) {
      window.turnstile.reset(this.widgetId);
    }
  }
}
