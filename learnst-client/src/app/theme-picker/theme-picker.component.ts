// theme-picker.component.ts
import { Component } from '@angular/core';
import { Theme, ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-picker',
  templateUrl: './theme-picker.component.html',
  styleUrls: ['./theme-picker.component.less']
})
export class ThemePickerComponent {
  isPremium = true; // Получать из сервиса авторизации
  availableThemes: Theme[] = ThemeService.THEMES;

  constructor(private themeService: ThemeService) { }

  applyTheme(themeName: string) {
    this.themeService.applyTheme(themeName);
  }
}
