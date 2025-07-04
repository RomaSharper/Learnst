import {Component, DestroyRef, inject, Input, OnInit, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import {Router, RouterLink} from '@angular/router';
import {finalize} from 'rxjs';
import {NoDownloadingDirective} from '../../../angular/directives/no-downloading.directive';
import {PlaceholderImageDirective} from '../../../angular/directives/placeholder-image.directive';
import {EllipsisPipe} from '../../../angular/pipes/ellipsis.pipe';
import {PluralPipe} from '../../../angular/pipes/plural.pipe';
import {AlertService} from '../../../data/services/alert.service';
import {AuthService} from '../../../data/services/auth.service';
import {UsersService} from '../../../data/services/users.service';
import {User} from '../../../data/models/User';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';
import {LogService} from '../../../data/services/log.service';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  imports: [
    PluralPipe,
    RouterLink,
    EllipsisPipe,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    NoDownloadingDirective,
    MatProgressSpinnerModule,
    PlaceholderImageDirective
  ]
})
export class UserMenuComponent implements OnInit {
  @Input() user: User | null = null;
  @Input() redirectOnly: boolean | null = null;
  loading = signal(true);
  followersCount = signal(0);
  isFollowing = signal(false);
  currentUser = signal<User | null>(null);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private logService = inject(LogService);
  private sanitizer = inject(DomSanitizer);
  private authService = inject(AuthService);
  accounts = this.authService.accounts;
  private usersService = inject(UsersService);
  private alertService = inject(AlertService);

  ngOnInit(): void {
    if (!this.user?.id)
      this.loading.set(false);
    else
      this.loadData();
  }

  handleFollow(): void {
    if (!this.currentUser() || !this.user?.id) return;

    this.loading.set(true);
    const currentUserId = this.currentUser()!.id!;
    const targetUserId = this.user.id;

    const action = this.isFollowing()
      ? this.usersService.unfollowUser(currentUserId, targetUserId)
      : this.usersService.followUser(currentUserId, targetUserId);

    action.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => {
        this.isFollowing.update(v => !v);
        this.followersCount.update(c => this.isFollowing() ? c + 1 : c - 1);
        this.alertService.showSnackBar('Успешно обновлено');
      },
      error: (err) => {
        this.logService.error(err);
        this.alertService.showSnackBar('Ошибка обновления');
      }
    });
  }

  switchAccount(accountId: string): void {
    this.authService.switchAccount(accountId);
  }

  deleteAccount(accountId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.alertService.openConfirmDialog(
      'Выход из дополнительного аккаунта',
      'Вы уверены, что хотите выйти из дополнительного аккаунта?'
    ).afterClosed().subscribe(result => {
      if (result) this.authService.removeAccount(accountId);
    });
  }

  logout(): void {
    this.alertService.openConfirmDialog(
      'Выход из текущего аккаунта',
      'Вы уверены, что хотите выйти из текущего аккаунта?'
    ).afterClosed().subscribe(result => {
      if (!result) return;
      this.authService.removeAccount(this.user?.id!);
      this.router.navigate(['/login']);
    });
  }

  openChangeBannerDialog(event: Event): void {
    event.stopPropagation();
    this.alertService.openChangeBannerDialog(this.user!.banner).afterClosed().subscribe({
      next: (newBanner: string | undefined) => {
        if (!newBanner || !this.user) return;

        // Обновляем баннер локально
        this.user.banner = newBanner;

        // Отправляем изменения на сервер
        this.usersService.updateUser(this.user.id!, this.user).subscribe({
          next: response => {
            this.alertService.showSnackBar('Баннер успешно обновлен.');
            this.authService.setUser(response.user!); // Обновляем пользователя в вашем сервисе аутентификации
          },
          error: error => {
            this.alertService.showSnackBar('Не удалось обновить данные пользователя.');
            this.logService.errorWithData('Ошибка при обновлении данных:', error);
          }
        });
      },
      error: error => {
        this.logService.error(error);
        this.alertService.showSnackBar('Ошибка при изменении баннера');
      }
    });
  }

  getBannerStyle(value: string): SafeStyle {
    if (value.startsWith('#')) {
      return this.sanitizer.bypassSecurityTrustStyle(value);
    }

    // Заменяем обратные слеши и экранируем специальные символы
    const safeUrl = value.replace(/\\/g, '/').replace(/'/g, "\\'");
    return this.sanitizer.bypassSecurityTrustStyle(`url('${safeUrl}')`);
  }

  private loadData(): void {
    try {
      this.authService.getUser().subscribe(user => {
        this.currentUser.set(user);
        const userId = this.user?.id;

        if (!userId) return;
        this.usersService.getFollowers(userId).subscribe(followers => {
          this.isFollowing.set(followers.some(f => f.id === user?.id));
          this.followersCount.set(followers.length);
        });
      });
    } catch (error) {
      if (!(error instanceof Error)) return;
      this.alertService.showSnackBar(error.message);
      this.logService.error(error);
    } finally {
      this.loading.set(false);
    }
  }
}
