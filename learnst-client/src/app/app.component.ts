import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NoDownloadingDirective } from '../directives/NoDownloadingDirective';
import { PlaceholderImageDirective } from '../directives/PlaceholderImageDirective';
import { User } from '../models/User';
import { AuthService } from '../services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MediumScreenSupport } from '../helpers/MediumScreenSupport';
import { ThemePickerComponent } from './theme-picker/theme-picker.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
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
  ]
})
export class AppComponent extends MediumScreenSupport {
  isMenuOpen = false;
  user: User | null = null;

  constructor(private authService: AuthService) {
    super();
    authService.getUser().subscribe(user => this.user = user);
  }

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(event: Event): void {
    event.stopPropagation();
    if (this.isMenuOpen)
      this.isMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const clickedInsideMenu = (event.target as HTMLElement).closest('.main-navigation');
    const clickedOnOverlay = (event.target as HTMLElement).classList.contains('background-overlay');

    if (this.isMenuOpen && !clickedInsideMenu && !clickedOnOverlay)
      this.closeMenu(event);
  }
}
