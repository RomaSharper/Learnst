import {inject, Injectable} from '@angular/core';
import {CanDeactivate} from '@angular/router';
import {lastValueFrom} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '../app/confirm-dialog/confirm-dialog.component';
import {CanComponentDeactivate} from '../helpers/CanComponentDeactivate';

@Injectable({
  providedIn: 'root',
})
export class ConfirmGuard implements CanDeactivate<CanComponentDeactivate> {
  private dialog = inject(MatDialog);

  async canDeactivate(component: CanComponentDeactivate): Promise<boolean> {
    return component.canDeactivate && !component.canDeactivate()
      ? await this.showConfirmDialog()
      : true;
  }

  private async showConfirmDialog(): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Несохранённые изменения',
        message: 'У вас есть несохранённые изменения. Вы уверены, что хотите уйти?',
        confirmText: 'Уйти',
        cancelText: 'Остаться',
      },
    });

    return await lastValueFrom(dialogRef.afterClosed());
  }
}
