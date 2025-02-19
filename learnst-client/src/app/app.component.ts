import { Component, signal, effect, HostListener } from '@angular/core';
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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    RouterLink,
    CommonModule,
    RouterOutlet,
    MatIconModule,
    MatButtonModule,
    RouterLinkActive,
    NoDownloadingDirective,
    MatProgressSpinnerModule,
    PlaceholderImageDirective,
  ],
})
export class AppComponent extends MediumScreenSupport {
  loading = signal(true);
  isMenuOpen = signal(false);
  user = signal<User | null>(null);
  welcomeMessage = signal<string | null>(null);
  private excludedRoutes = ['/login', '/register'];

  constructor(
    private router: Router,
    private authService: AuthService,
    private themeService: ThemeService,
  ) {
    super();
    effect(() => {
      this.authService.getUser().subscribe((user) => {
        this.user.set(user);
        this.updateWelcomeMessage();
      });
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
    const userName = this.user()?.username || 'гость';

    if (this.isExcludedRoute()) {
      this.welcomeMessage.set(null);
      setTimeout(() => this.loading.set(false), 800);
    } else {
      setTimeout(() => this.welcomeMessage.set(`Добро пожаловать, ${userName}!`), 300);
      setTimeout(() => this.loading.set(false), 1500);
    }
  }

  // Обработчик кликов вне меню
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    // const clickedInsideMenu = (event.target as HTMLElement).closest('.main-navigation');
    const clickedOnOverlay = (event.target as HTMLElement).classList.contains('background-overlay');

    if (this.isMenuOpen() && !clickedOnOverlay)
      this.closeMenu(event);
  }
}
