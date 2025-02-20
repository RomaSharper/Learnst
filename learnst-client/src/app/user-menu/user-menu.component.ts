import { MatIconModule } from '@angular/material/icon';
import { User } from './../../models/User';
import { Component, inject, Input } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { NoDownloadingDirective } from '../../directives/NoDownloadingDirective';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  imports: [RouterLink, MatIconModule, MatMenuModule, NoDownloadingDirective]
})
export class UserMenuComponent {
  @Input() user!: User;
  router = inject(Router);
  dialog = inject(MatDialog);
  authService = inject(AuthService);
  alertService = inject(AlertService);
  accounts = this.authService.accounts;

  switchAccount(accountId: string): void {
    this.authService.switchAccount(accountId);
  }

  deleteAccount(accountId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.alertService.openConfirmDialog(
      'Выход из аккаунта',
      'Вы уверены, что хотите выйти из этого аккаунта?'
    ).afterClosed().subscribe(result => {
      if (result)
        this.authService.removeAccount(accountId);
    });
  }

  logout(): void {
    this.alertService.openConfirmDialog(
      'Выход из всех аккаунтов',
      'Вы уверены, что хотите выйти из всех аккаунтов?'
    ).afterClosed().subscribe(result => {
      if (result)
        this.authService.logout(true);
    });
  }
}
