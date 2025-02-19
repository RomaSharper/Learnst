import { Component, inject, OnInit, signal } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/User';
import { NoDownloadingDirective } from '../../directives/NoDownloadingDirective';

@Component({
  selector: 'app-theme-picker',
  templateUrl: './theme-picker.component.html',
  styleUrls: ['./theme-picker.component.scss'],
  imports: [MatTooltipModule, NoDownloadingDirective]
})
export class ThemePickerComponent implements OnInit {
  private user = signal<User | null>(null);
  private readonly authService: AuthService = inject(AuthService);
  private readonly themeService: ThemeService = inject(ThemeService);

  ngOnInit(): void {
    this.authService.getUser().subscribe(user => {
      this.user.set(user);
    });
  }

  isThemeSelected(themeId: string): boolean {
    return this.currentTheme().id === themeId;
  }

  themes = signal(this.themeService.getThemes());
  currentTheme = signal(this.themeService.currentTheme());

  selectTheme(themeId: string): void {
    this.themeService.setTheme(themeId);
    this.currentTheme.set(this.themes().find(theme => theme.id === themeId)!);
  }
}
