import {Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatTooltipModule} from '@angular/material/tooltip';
import {Router} from '@angular/router';
import {PlaceholderImageDirective} from '../../../angular/directives/placeholder-image.directive';
import {RuDateTimePipe} from '../../../angular/pipes/ru.date.time.pipe';
import {AlertService} from '../../../data/services/alert.service';
import {AuthService} from '../../../data/services/auth.service';

@Component({
  selector: 'app-accounts-manager',
  templateUrl: './accounts-manager.component.html',
  styleUrls: ['./accounts-manager.component.scss'],
  imports: [
    MatListModule,
    MatIconModule,
    RuDateTimePipe,
    MatButtonModule,
    MatTooltipModule,
    PlaceholderImageDirective
  ],
})
export class AccountsManagerComponent {
  authService = inject(AuthService);
  private router = inject(Router);
  private alertService = inject(AlertService);

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
