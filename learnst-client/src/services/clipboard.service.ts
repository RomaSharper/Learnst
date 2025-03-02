import { Injectable } from '@angular/core';

export type ClipboardContentType =
  'text/plain' |
  'text/html' |
  'image/png' |
  'application/json';

interface ClipboardError extends Error {
  name: 'ClipboardError';
  originalError?: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class ClipboardService {
  private readonly clipboard: Clipboard;

  constructor() {
    this.clipboard = navigator.clipboard;
  }

  get isSupported(): boolean {
    return !!this.clipboard && !!document.hasFocus && document.hasFocus();
  }

  async copy(content: Record<ClipboardContentType, Blob>): Promise<void> {
    if (!this.isSupported)
      throw this.createError('Clipboard API is not supported');

    const clipboardItems = Object.entries(content).map(
      ([type, blob]) => new ClipboardItem({ [type]: blob })
    );

    await this.clipboard.write(clipboardItems);
  }

  async paste(): Promise<ClipboardItems> {
    if (!this.isSupported)
      throw this.createError('Clipboard API not supported');

    try {
      const clipboardItems = await this.clipboard.read();
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
