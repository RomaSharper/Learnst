// theme-picker.component.ts
import { Component } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-picker',
  templateUrl: './theme-picker.component.html',
  styleUrls: ['./theme-picker.component.less']
})
export class ThemePickerComponent {
  isPremium = true; // Получать из сервиса авторизации
  availableThemes: string[] = ['dark-mode', 'light-mode'];

  constructor(private themeService: ThemeService) {
    this.applyTheme(localStorage.getItem('theme') || 'light-mode');
  }

  applyTheme(themeName: string) {
    this.themeService.applyTheme(themeName);
  }
}
