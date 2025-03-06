import { MatIconModule } from '@angular/material/icon';
import { User } from './../../models/User';
import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterLink } from '@angular/router';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { NoDownloadingDirective } from '../../directives/NoDownloadingDirective';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EllipsisPipe } from '../../pipes/ellipsis.pipe';
import { PlaceholderImageDirective } from '../../directives/PlaceholderImageDirective';
import { UsersService } from '../../services/users.service';
import { FileService } from '../../services/file.service';
import { MatButtonModule } from '@angular/material/button';
import { PluralPipe } from '../../pipes/plural.pipe';
import { forkJoin, switchMap } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
  @Input() redirectOnly = true;
  @Input() user: User | null = null;

  private router = inject(Router);
  private fileService = inject(FileService);
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private alertService = inject(AlertService);


  loading = signal(true);
  isPremium = signal(false);
  followersCount = signal(0);
  isFollowing = signal(false);
  currentUser = signal<User | null>(null);
  isBannerImage = signal(false);
  accounts = this.authService.accounts;

  ngOnInit(): void {
    this.initializeData();
  }

  private initializeData(): void {
    if (!this.user?.id) {
      this.loading.set(false);
      return;
    }

    // Загружаем данные параллельно
    forkJoin([
      this.authService.getUser(),
      this.usersService.isPremium(this.user.id),
      this.usersService.getFollowers(this.user.id),
      this.usersService.getFollowersCount(this.user.id)
    ]).subscribe({
      next: ([currentUser, premiumResponse, followers, followersCount]) => {
        this.currentUser.set(currentUser);
        this.isPremium.set(premiumResponse.premium);
        this.isBannerImage.set(this.user!.banner?.startsWith('http') && this.isPremium());
        this.isFollowing.set(followers.some(f => f.id === this.currentUser()?.id));
        this.followersCount.set(followersCount);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Ошибка загрузки данных:', err);
        this.alertService.showSnackBar('Не удалось загрузить данные');
      }
    });
  }

  handleFollow(): void {
    const currentUserId = this.currentUser()?.id;
    const targetUserId = this.user?.id;
    if (!currentUserId || !targetUserId) return;

    this.loading.set(true);

    const action = this.isFollowing()
      ? this.usersService.unfollowUser(currentUserId, targetUserId)
      : this.usersService.followUser(currentUserId, targetUserId);

    action.pipe(
      switchMap(() => this.usersService.getFollowers(targetUserId))
    ).subscribe({
      next: (followers) => {
        this.isFollowing.set(followers.some(f => f.id === currentUserId));
        this.updateCounters(targetUserId);
        this.loading.set(false);
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
      const userId = this.user?.id;
      if (!result || !userId) return;
      this.authService.removeAccount(userId);
      this.router.navigate(['/login']);
    });
  }

  openChangeBannerDialog(): void {
    this.alertService.openChangeBannerDialog(
      this.isPremium(),
      this.user?.banner
    ).afterClosed().subscribe({
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
        this.updateUser(this.user);
      },
      error: error => console.error(error)
    });
  }

  private updateCounters(userId: string): void {
    this.usersService.getFollowersCount(userId).subscribe(count =>
      this.followersCount.set(count));
  }

  // Метод для загрузки файла изображения
  private uploadImageFile(file: File, user: User): void {
    this.fileService.upload(file).subscribe({
      next: (response) => {
        if (user.banner)
          this.deleteOriginalBanner(user.banner); // Удаляем старый баннер, если он есть
        user.banner = response.fileUrl; // Обновляем URL с загруженного файла
        this.updateUser(user); // Обновляем данные пользователя на сервере
      },
      error: (error) => {
        this.alertService.showSnackBar('Не удалось загрузить файл.');
        console.error('Ошибка при загрузке файла:', error);
      }
    });
  }

  // Метод для обновления пользователя
  private updateUser(user: User): void {
    const userId = user.id;
    if (!userId) return;
    this.usersService.updateUser(userId, user).subscribe({
      next: (response) => {
        console.log(response);
        this.alertService.showSnackBar('Баннер успешно обновлен.');
        this.authService.setUser(user); // Обновляем пользователя в вашем сервисе аутентификации
      },
      error: (error) => {
        this.alertService.showSnackBar('Не удалось обновить данные пользователя.');
        console.error('Ошибка при обновлении данных:', error);
      }
    });
  }

  // Метод для удаления старого баннера
  private deleteOriginalBanner(originalBannerUrl: string): void {
    this.fileService.delete(originalBannerUrl).subscribe({
      next: () => console.log('Старый баннер удалён успешно.'),
      error: (error) => console.error('Ошибка при удалении старого баннера:', error)
    });
  }
}
