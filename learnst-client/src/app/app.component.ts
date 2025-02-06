import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NoDownloadingDirective } from '../directives/NoDownloadingDirective';
import { PlaceholderImageDirective } from '../directives/PlaceholderImageDirective';
import { Role } from '../enums/Role';
import { RoleHelper } from '../helpers/RoleHelper';
import { User } from '../models/User';
import { AuthService } from '../services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MediumScreenSupport } from '../helpers/MediumScreenSupport';

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
    PlaceholderImageDirective,
    NoDownloadingDirective
  ]
})
export class AppComponent extends MediumScreenSupport {
  isSwiping = false;
  isMenuOpen = false;
  overlayOpacity = '0';
  menuTranslateX = -100;
  user: User | null = null;

  private startX = 0;
  private currentX = 0;
  private readonly menuWidth = 280;

  Role = Role;
  RoleHelper = RoleHelper;

  constructor(private authService: AuthService) {
    super();
  }

  ngOnInit(): void {
    this.authService.getUser().subscribe(user => this.user = user);
  }

  closeMenu(event: Event) {
    event.stopPropagation();
    if (this.isMenuOpen)
      this.updateMenuState(false);
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
    this.updateMenuState(this.isMenuOpen);
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    if (!this.isMediumScreen) return;

    this.isSwiping = true;
    this.startX = event.touches[0].clientX;
    this.currentX = this.startX;
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    if (!this.isSwiping || !this.isMediumScreen) return;

    this.currentX = event.touches[0].clientX;
    const delta = this.currentX - this.startX;

    if (!this.isMenuOpen && delta < 0) return;

    const progress = Math.min(Math.max(delta / this.menuWidth, 0), 1);
    this.menuTranslateX = -100 + progress * 100;
    this.overlayOpacity = progress.toString();
  }

  @HostListener('touchend')
  onTouchEnd() {
    if (!this.isSwiping) return;
    this.isSwiping = false;

    const threshold = this.menuWidth * 0.3;
    const delta = this.currentX - this.startX;
    const shouldOpen = delta > threshold || (delta > 0 && this.menuTranslateX > -50);

    this.updateMenuState(shouldOpen);
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const clickedInsideMenu = (event.target as HTMLElement).closest('.main-navigation');
    const isOverlay = (event.target as HTMLElement).classList.contains('background-overlay');

    if (this.isMenuOpen && !clickedInsideMenu && !isOverlay) {
      event.stopPropagation();
      this.updateMenuState(false);
    }
  }

  private updateMenuState(open: boolean) {
    this.menuTranslateX = open ? 0 : -100;
    this.overlayOpacity = open ? '1' : '0';
    this.isMenuOpen = open;
  }
}
