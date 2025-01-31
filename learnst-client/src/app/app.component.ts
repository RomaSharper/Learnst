import { CommonModule, NgClass } from '@angular/common';
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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
  imports: [NgClass, RouterLink, CommonModule, RouterOutlet, MatIconModule, MatButtonModule, RouterLinkActive, PlaceholderImageDirective, NoDownloadingDirective]
})
export class AppComponent {
  isMenuOpen = false;
  user: User | null = null;

  Role = Role;
  RoleHelper = RoleHelper;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.authService.getUser().subscribe(user => {
      this.user = user;
    });
  }

  @HostListener('document:click', ['$event'])
  onClick(_event: MouseEvent) {
    this.isMenuOpen = false;
  }

  toggleMenu(event: MouseEvent) {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  }
}
