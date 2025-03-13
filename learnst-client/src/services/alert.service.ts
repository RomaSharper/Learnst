import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar'; // Импортируем MatSnackBar
import { ConfirmDialogComponent } from '../app/confirm-dialog/confirm-dialog.component';
import { MessageDialogComponent } from '../app/message-dialog/message-dialog.component';
import { VerificationDialogComponent } from '../app/verification-dialog/verification-dialog.component';
import { ChangeBannerDialogComponent } from '../app/user-menu/change-banner-dialog/change-banner-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  constructor(private dialog: MatDialog, private snackBar: MatSnackBar) { }

  /**
   * Заголовок для диалога с подтверждением.
   */
  static CONFIRM_TITLE = 'Требуется подтверждение';

  /**
   * Заголовок для диалога с ошибкой.
   */
  static ERROR_TITLE = 'Возникла ошибка';

  /**
   * Заголовок для диалога с сообщением об успехе.
   */
  static SUCCESS_TITLE = 'Успех операции';

  getDialog() {
    return this.dialog;
  }

  /**
   * Открывает диалог подтверждения.
   * @param title Заголовок диалога.
   * @param message Сообщение в диалоге.
   * @param confirmText Текст кнопки подтверждения (по умолчанию "Да").
   * @param cancelText Текст кнопки отмены (по умолчанию "Нет").
   * @returns Observable<boolean>, который возвращает true, если пользователь подтвердил, и false, если отменил.
   */
  openConfirmDialog(
    title: string,
    message: string,
    confirmText: string = 'Да',
    cancelText: string = 'Нет'
  ): MatDialogRef<ConfirmDialogComponent, boolean> {
    return this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title, message, confirmText, cancelText },
    });
  }

  /**
   * Открывает диалог с сообщением.
   * @param title Заголовок диалога.
   * @param message Сообщение в диалоге.
   * @param okText Текст кнопки "Ок" (по умолчанию "Ок").
   * @returns Observable<void>, который завершается при закрытии диалога.
   */
  openMessageDialog(
    title: string,
    message: string,
    okText: string = 'Ок'
  ): MatDialogRef<MessageDialogComponent, void> {
    return this.dialog.open(MessageDialogComponent, {
      width: '400px',
      data: { title, message, okText },
    });
  }

  openVerificationCodeDialog(email: string): MatDialogRef<VerificationDialogComponent, number> {
    return this.dialog.open(VerificationDialogComponent, {
      width: '400px',
      data: { email }
    });
  }

  openChangeBannerDialog(banner?: string): MatDialogRef<ChangeBannerDialogComponent, string> {
    return this.dialog.open(ChangeBannerDialogComponent, {
      width: '400px',
      data: { banner }
    });
  }

  /**
   * Открывает SnackBar с сообщением и кнопкой.
   * @param message Сообщение в SnackBar.
   * @param actionText Текст кнопки (по умолчанию "Закрыть").
   * @param duration Длительность отображения (по умолчанию 3000 мс).
   */
  showSnackBar(message: string, actionText: string = 'Закрыть', duration: number | null = null): MatSnackBarRef<TextOnlySnackBar> {
    if (duration) return this.snackBar.open(message, actionText, { duration });
    return this.snackBar.open(message, actionText);
  }
}
