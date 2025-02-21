import { Component, signal, effect, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NoDownloadingDirective } from '../directives/NoDownloadingDirective';
import { PlaceholderImageDirective } from '../directives/PlaceholderImageDirective';
import { User } from '../models/User';
import { AuthService } from '../services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MediumScreenSupport } from '../helpers/MediumScreenSupport';
import { ThemeService } from '../services/theme.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatMenuModule } from '@angular/material/menu';
import { UserMenuComponent } from './user-menu/user-menu.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    RouterLink,
    CommonModule,
    RouterOutlet,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    RouterLinkActive,
    UserMenuComponent,
    NoDownloadingDirective,
    MatProgressSpinnerModule,
    PlaceholderImageDirective,
  ],
})
export class AppComponent extends MediumScreenSupport {
  loading = signal(true);
  isMenuOpen = signal(false);
  authService = inject(AuthService);
  user = toSignal(this.authService.getUser());
  welcomeMessage = signal<string | null>(null);
  private excludedRoutes = ['/login', '/register'];

  constructor(
    private router: Router,
    private themeService: ThemeService,
  ) {
    super();
    effect(() => {
      this.themeService.setTheme(this.user()?.themeId || 'light');
      this.updateWelcomeMessage();
    });
  }

  isExcludedRoute(): boolean {
    return this.excludedRoutes.includes(this.router.url);
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

  updateWelcomeMessage(): void {
    const userName = this.user()?.username || null;

    if (this.isExcludedRoute()) {
      this.loading.set(false);
    } else {
      setTimeout(() => this.welcomeMessage.set(userName ? `Добро пожаловать, ${userName}!` : null), 300);
      setTimeout(() => this.loading.set(false), 1500);
    }
  }

  // Обработчик кликов вне меню
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const clickedInsideMenu = (event.target as HTMLElement).closest('.main-navigation');
    const clickedOnOverlay = (event.target as HTMLElement).classList.contains('background-overlay');

    if (this.isMenuOpen() && !clickedOnOverlay && !clickedInsideMenu)
      this.closeMenu(event);
  }
}
