import {CommonModule} from '@angular/common';
import {Component, effect, HostListener, inject, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {NoDownloadingDirective} from '../directives/no-downloading.directive';
import {PlaceholderImageDirective} from '../directives/placeholder-image.directive';
import {MediumScreenSupport} from '../helpers/MediumScreenSupport';
import {User} from '../models/User';
import {EllipsisPipe} from '../pipes/ellipsis.pipe';
import {AlertService} from '../services/alert.service';
import {AuthService} from '../services/auth.service';
import {ThemeService} from '../services/theme.service';
import {UserMenuComponent} from './user-menu/user-menu.component';
import {MascotComponent} from './mascot/mascot.component';
import {UserStatusService} from '../services/user.status.service';
import {AudioService} from '../services/audio.service';
import {Status} from '../enums/Status';
import {LogService} from '../services/log.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    RouterLink,
    EllipsisPipe,
    CommonModule,
    RouterOutlet,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MascotComponent,
    RouterLinkActive,
    MatTooltipModule,
    UserMenuComponent,
    NoDownloadingDirective,
    MatProgressSpinnerModule,
    PlaceholderImageDirective
  ],
})
export class AppComponent extends MediumScreenSupport {
  loading = signal(true);
  isMenuOpen = signal(false);
  user = signal<User | null>(null);

  protected router = inject(Router);
  protected audioService = inject(AudioService);

  private logService = inject(LogService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private themeService = inject(ThemeService);
  private userStatusService = inject(UserStatusService);

  constructor() {
    super();
    effect(() => {
      this.authService.getUser().subscribe({
        next: user => {
          this.user.set(user);
          const themeId = user?.themeId || 'light';

          if (!user?.id) {
            this.themeService.setLocalTheme(themeId);
            this.loading.set(false);
            return;
          }

          this.userStatusService.initialize(user.id);

          // Отслеживание сетевого статуса
          window.addEventListener('online', () =>
            this.userStatusService.updateStatus(Status.Online));

          window.addEventListener('offline', () =>
            this.userStatusService.updateStatus(Status.Offline));

          this.themeService.setTheme(themeId).subscribe({
            next: () => setTimeout(() => this.loading.set(false), 1600),
            error: _err => this.loading.set(false)
          });
        },
        error: error => {
          this.logService.errorWithData('Ошибка при получении данных пользователя:', error);
          this.alertService.showSnackBar(error);
          this.loading.set(false);
        }
      });
    });
  }

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.isMenuOpen.update((value) => !value);
  }

  closeMenu(event: Event): void {
    event.stopPropagation();
    if (this.isMenuOpen()) this.isMenuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const el = event.target as HTMLElement;
    const clickedOnLink = el.closest('a');
    const clickedInsideMenu = el.closest('.main-navigation');
    const clickedOnOverlay = el.classList.contains('background-overlay')
      || el.classList.contains('cdk-overlay-backdrop')
      || el.closest('.cdk-overlay-backdrop')
      || el.closest('.background-overlay');

    const clickedOnAlerts = el.closest('.mat-mdc-dialog-actions') || el.closest('.cdk-overlay-container');
    const clickedOnBannerEditBtn = el.classList.contains('edit-banner-btn');
    const clickedOnMenuItem = el.closest('.user-menu')
      || el.closest('.user-menu-item')
      || el.closest('.mobile-menu li')
      || el.closest('.desktop-menu li');

    if (this.isMenuOpen() && !clickedOnOverlay && !clickedInsideMenu && !clickedOnAlerts && !clickedOnBannerEditBtn
      || clickedOnLink || clickedOnMenuItem)
      this.closeMenu(event);
  }
}
