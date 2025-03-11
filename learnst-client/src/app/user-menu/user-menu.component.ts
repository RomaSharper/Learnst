import { Component, DestroyRef, inject, Input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NoDownloadingDirective } from '../../directives/no-downloading.directive';
import { PlaceholderImageDirective } from '../../directives/placeholder-image.directive';
import { EllipsisPipe } from '../../pipes/ellipsis.pipe';
import { PluralPipe } from '../../pipes/plural.pipe';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { FileService } from '../../services/file.service';
import { UsersService } from '../../services/users.service';
import { User } from './../../models/User';

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

  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private fileService = inject(FileService);
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private alertService = inject(AlertService);

  loading = signal(true);
  followersCount = signal(0);
  isFollowing = signal(false);
  isBannerImage = signal(false);
  accounts = this.authService.accounts;
  currentUser = signal<User | null>(null);

  ngOnInit(): void {
    if (!this.user?.id) {
      this.loading.set(false);
      return;
    }

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
        console.error(err);
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
      if (result)
        this.authService.removeAccount(accountId);
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
      next: response => {
        if (!response || !this.user) return;

        const { bannerType, color, imageUrl, imageFile } = response;

        if (bannerType === 'color')
          this.user.banner = color; // Устанавливаем цвет
        else if (bannerType === 'image')
          if (imageUrl)
            this.user.banner = imageUrl; // Если URL, обновляем баннер
          else if (imageFile)
            this.uploadImageFile(imageFile, this.user); // Если файл, загружаем его

        // Обновляем данные пользователя
        this.updateUser({
          ...this.currentUser(),
          ...this.user
        });
      },
      error: error => {
        console.error(error);
      }
    });
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
      if (error instanceof Error)
        this.alertService.showSnackBar(error.message);
      console.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  // Метод для загрузки файла изображения
  private uploadImageFile(file: File, user: User): void {
    this.fileService.upload(file).subscribe({
      next: response => {
        if (user.banner?.startsWith('http'))
          this.deleteOriginalBanner(user.banner); // Удаляем старый баннер, если он есть
        this.updateUser({
          ...this.currentUser(),
          ...user,
          banner: response.fileUrl // Обновляем URL с загруженного файла
        }); // Обновляем данные пользователя на сервере
      },
      error: error => {
        this.alertService.showSnackBar('Не удалось загрузить файл.');
        console.error('Ошибка при загрузке файла:', error);
      }
    });
  }

  // Метод для обновления пользователя
  private updateUser(user: User): void {
    this.usersService.updateUser(user.id!, user).subscribe({
      next: _response => {
        this.alertService.showSnackBar('Баннер успешно обновлен.');
        this.authService.setUser(user); // Обновляем пользователя в вашем сервисе аутентификации
      },
      error: error => {
        this.alertService.showSnackBar('Не удалось обновить данные пользователя.');
        console.error('Ошибка при обновлении данных:', error);
      }
    });
  }

  // Метод для удаления старого баннера
  private deleteOriginalBanner(originalBannerUrl: string): void {
    this.fileService.delete(originalBannerUrl).subscribe({
      next: () => console.log('Старый баннер удалён успешно.'),
      error: error => console.error('Ошибка при удалении старого баннера:', error)
    });
  }
}
