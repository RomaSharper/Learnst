import { Component, effect, inject, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { RuDateTimePipe } from '../../pipes/ru.date.time.pipe';
import { AlertService } from '../../services/alert.service';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-accounts-manager',
  templateUrl: './accounts-manager.component.html',
  styleUrls: ['./accounts-manager.component.scss'],
  imports: [
    MatListModule,
    MatIconModule,
    RuDateTimePipe,
    MatButtonModule,
    MatTooltipModule
  ],
})
export class AccountsManagerComponent {
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);

  authService = inject(AuthService);
  currentAccountId = toSignal(this.authService.currentUser$.pipe(
    map(user => user?.openid)
  ));

  switchAccount(accountId: string, event?: MouseEvent): void {
    event?.stopPropagation();
    this.authService.switchAccount(accountId);
    this.router.navigate(['/']);
  }

  removeAccount(accountId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.alertService.openConfirmDialog(
      'Удаление аккаунта',
      'Вы уверены, что хотите удалить этот аккаунт из сохраненных?'
    ).afterClosed().subscribe(confirmed => {
      if (confirmed)
        this.authService.removeAccount(accountId);
    });
  }

  logoutAll(): void {
    this.alertService.openConfirmDialog(
      'Полный выход',
      'Вы уверены, что хотите выйти из всех аккаунтов?'
    ).afterClosed().subscribe(confirmed => {
      if (confirmed)
        this.authService.logout(true);
    });
  }
}
