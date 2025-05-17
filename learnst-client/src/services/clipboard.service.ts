import {inject, Injectable, NgZone} from '@angular/core';
import {AlertService} from './alert.service';
import {LogService} from './log.service';

export type ClipboardContentType =
  'text/plain' |
  'text/html' |
  'image/png' |
  'application/json';

interface ClipboardError extends Error {
  name: 'ClipboardError';
  originalError?: unknown;
}

// noinspection JSUnusedGlobalSymbols
@Injectable({
  providedIn: 'root'
})
export class ClipboardService {
  private ngZone = inject(NgZone);
  private logService = inject(LogService);
  private readonly clipboard = navigator.clipboard;

  get isSupported(): boolean {
    return !!this.clipboard && !!document.hasFocus && document.hasFocus();
  }

  copyText(text: string, alertService: AlertService, snackBarMessage?: string): void {
    this.copy({
      type: 'text/plain',
      blob: new Blob([text], { type: 'text/plain' })
    })
      .then(() => alertService.showSnackBar(snackBarMessage ?? 'Текст успешно скопирован'))
      .catch(err => this.logService.errorWithData('Копирование в буфер обмена не удалось: ', err));
  }

  async copy(content: { type: ClipboardContentType, blob: Blob }): Promise<void> {
    if (!this.isSupported)
      throw this.createError('Clipboard API is not supported');

    const clipboardItem = new ClipboardItem({ [content.type]: content.blob });

    await this.ngZone.runOutsideAngular(async () =>
      await this.clipboard.write([clipboardItem])
    );
  }

  async paste(): Promise<ClipboardItems | null> {
    if (!this.isSupported)
      throw this.createError('Clipboard API not supported');

    let clipboardItems = null;

    try {
      await this.ngZone.runOutsideAngular(async () =>
        clipboardItems = await this.clipboard.read()
      );

      return clipboardItems;
    } catch (error) {
      throw this.createError('Paste failed', error);
    }
  }

  private createError(message: string, originalError?: unknown): ClipboardError {
    return {
      name: 'ClipboardError',
      message,
      originalError,
    };
  }
}
