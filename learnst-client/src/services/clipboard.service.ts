import { Injectable, NgZone } from '@angular/core';

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
  private readonly clipboard: Clipboard;

  constructor(private ngZone: NgZone) {
    this.clipboard = navigator.clipboard;
  }

  get isSupported(): boolean {
    return !!this.clipboard && !!document.hasFocus && document.hasFocus();
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
