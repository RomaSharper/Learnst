// import { CommonModule } from '@angular/common';
// import { Component, HostListener } from '@angular/core';
// import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
// import { NoDownloadingDirective } from '../directives/NoDownloadingDirective';
// import { PlaceholderImageDirective } from '../directives/PlaceholderImageDirective';
// import { User } from '../models/User';
// import { AuthService } from '../services/auth.service';
// import { MatIconModule } from '@angular/material/icon';
// import { MatButtonModule } from '@angular/material/button';
// import { MediumScreenSupport } from '../helpers/MediumScreenSupport';
// import { ThemePickerComponent } from './theme-picker/theme-picker.component';
// import { ThemeService } from '../services/theme.service';

// @Component({
//   selector: 'app-root',
//   templateUrl: './app.component.html',
//   styleUrls: ['./app.component.scss'],
//   imports: [
//     RouterLink,
//     CommonModule,
//     RouterOutlet,
//     MatIconModule,
//     MatButtonModule,
//     RouterLinkActive,
//     ThemePickerComponent,
//     NoDownloadingDirective,
//     PlaceholderImageDirective,
//   ]
// })
// export class AppComponent extends MediumScreenSupport {
//   isMenuOpen = false;
//   user: User | null = null;

//   constructor(private themeService: ThemeService, private authService: AuthService) {
//     super();
//     authService.getUser().subscribe(user => this.user = user);
//   }

//   toggleMenu(event: Event): void {
//     event.stopPropagation();
//     this.isMenuOpen = !this.isMenuOpen;
//   }

//   closeMenu(event: Event): void {
//     event.stopPropagation();
//     if (this.isMenuOpen)
//       this.isMenuOpen = false;
//   }

//   @HostListener('document:click', ['$event'])
//   onClickOutside(event: MouseEvent): void {
//     const clickedInsideMenu = (event.target as HTMLElement).closest('.main-navigation');
//     const clickedOnOverlay = (event.target as HTMLElement).classList.contains('background-overlay');

//     if (this.isMenuOpen && !clickedInsideMenu && !clickedOnOverlay)
//       this.closeMenu(event);
//   }
// }

import { Component, signal, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NoDownloadingDirective } from '../directives/NoDownloadingDirective';
import { PlaceholderImageDirective } from '../directives/PlaceholderImageDirective';
import { User } from '../models/User';
import { AuthService } from '../services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MediumScreenSupport } from '../helpers/MediumScreenSupport';
import { ThemePickerComponent } from './theme-picker/theme-picker.component';
import { ThemeService } from '../services/theme.service';

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
    ThemePickerComponent,
    NoDownloadingDirective,
    PlaceholderImageDirective,
  ],
})
export class AppComponent extends MediumScreenSupport {
  // Сигнал для отслеживания состояния меню
  isMenuOpen = signal(false);

  // Сигнал для отслеживания текущего пользователя
  user = signal<User | null>(null);

  constructor(private themeService: ThemeService, private authService: AuthService) {
    super();

    // Используем effect для автоматического обновления сигнала при изменении данных о пользователе
    effect(() => {
      this.authService.getUser().subscribe((user) => {
        this.user.set(user);
      });
    });
  }

  // Метод для переключения состояния меню
  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.isMenuOpen.update((value) => !value); // Обновляем значение сигнала
  }

  // Метод для закрытия меню
  closeMenu(event: Event): void {
    event.stopPropagation();
    if (this.isMenuOpen())
      this.isMenuOpen.set(false); // Устанавливаем значение в false
  }

  // Обработчик кликов вне меню
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const clickedInsideMenu = (event.target as HTMLElement).closest('.main-navigation');
    const clickedOnOverlay = (event.target as HTMLElement).classList.contains('background-overlay');

    if (this.isMenuOpen() && !clickedInsideMenu && !clickedOnOverlay) {
      this.closeMenu(event);
    }
  }
}
