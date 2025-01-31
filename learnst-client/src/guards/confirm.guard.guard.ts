import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../app/confirm-dialog/confirm-dialog.component';
import { CanComponentDeactivate } from '../helpers/CanComponentDeactivate';

@Injectable({
  providedIn: 'root',
})
export class ConfirmGuard implements CanDeactivate<CanComponentDeactivate> {
  constructor(private dialog: MatDialog) { }

  canDeactivate(component: CanComponentDeactivate): Observable<boolean> | Promise<boolean> | boolean {
    if (component.canDeactivate && !component.canDeactivate())
      return this.showConfirmDialog();
    return true;
  }

  private showConfirmDialog(): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Несохранённые изменения',
        message: 'У вас есть несохранённые изменения. Вы уверены, что хотите уйти?',
        confirmText: 'Уйти',
        cancelText: 'Остаться',
      },
    });

    return dialogRef.afterClosed().toPromise();
  }
}
