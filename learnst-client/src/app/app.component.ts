import { Component, signal, effect, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NoDownloadingDirective } from '../directives/NoDownloadingDirective';
import { PlaceholderImageDirective } from '../directives/PlaceholderImageDirective';
import { AuthService } from '../services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MediumScreenSupport } from '../helpers/MediumScreenSupport';
import { ThemeService } from '../services/theme.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { UserMenuComponent } from './user-menu/user-menu.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EllipsisPipe } from '../pipes/ellipsis.pipe';
import { User } from '../models/User';
import { AlertService } from '../services/alert.service';

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
    RouterLinkActive,
    MatTooltipModule,
    UserMenuComponent,
    NoDownloadingDirective,
    MatProgressSpinnerModule,
    PlaceholderImageDirective
  ],
})
export class AppComponent extends MediumScreenSupport {
  authService = inject(AuthService);
  alertService = inject(AlertService);
  themeService = inject(ThemeService);

  loading = signal(true);
  isMenuOpen = signal(false);
  user = signal<User | null>(null);

  constructor(public router: Router) {
    super();
    effect(() => {
      this.authService.getUser().subscribe({
        next: user => {
          this.user.set(user);
          const themeId = user?.themeId || 'light';

          if (user?.id)
            this.themeService.setTheme(themeId).subscribe({
              next: () => this.loading.set(false),
              error: _err => this.loading.set(false)
            });
          else {
            this.themeService.setLocalTheme(themeId);
            this.loading.set(false);
          }
        },
        error: err => {
          this.alertService.showSnackBar(err);
          this.loading.set(false);
        }
      });
    });
  }

  // Метод для переключения состояния меню
  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.isMenuOpen.update((value) => !value);
  }

  // Метод для закрытия меню
  closeMenu(event: Event): void {
    event.stopPropagation();
    if (this.isMenuOpen())
      this.isMenuOpen.set(false);
  }

  // Обработчик кликов вне меню
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const el = event.target as HTMLElement;
    const clickedOnLink = el.closest('a');
    const clickedInsideMenu = el.closest('.main-navigation');
    const clickedOnOverlay = el.classList.contains('background-overlay')
      || el.classList.contains('cdk-overlay-backdrop')
      || el.closest('.background-overlay')
      || el.closest('.cdk-overlay-backdrop');
    const clickedOnAlerts = el.closest('.mat-mdc-dialog-actions')
      || el.closest('.cdk-overlay-container');
    const clickedOnBannerEditBtn = el.classList.contains('edit-banner-btn');
    const clickedOnMenuItem = el.classList.contains('user-menu-item');

    if (this.isMenuOpen() && !clickedOnOverlay && !clickedInsideMenu
      && !clickedOnAlerts && !clickedOnBannerEditBtn
      || clickedOnLink
      || clickedOnMenuItem)
      this.closeMenu(event);
  }
}
