import { Component } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { MatSelectChange, MatSelectModule } from '@angular/material/select'; // Импортируем MatSelectChange
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-theme-picker',
  templateUrl: './theme-picker.component.html',
  styleUrls: ['./theme-picker.component.scss'],
  imports: [MatSelectModule, MatFormFieldModule, MatIconModule]
})
export class ThemePickerComponent {
  // availableThemes: string[] = ['light-mode', 'dark-mode', 'system'];
  // selectedTheme: string = 'light-mode'; //  Изначально выбранная тема
  // isSystemTheme: boolean = false; //  Флаг для системной темы

  // constructor(private themeService: ThemeService) {
  //   this.selectedTheme = this.themeService.getCurrentTheme(); //  Инициализация выбранной темы
  //   this.isSystemTheme = this.selectedTheme === 'system';  //  Проверка системной темы
  // }

  // onThemeChange(event: MatSelectChange): void {
  //   const theme = event.value;
  //   if (theme === 'system') {
  //       this.themeService.setSystemTheme();
  //       this.isSystemTheme = true;
  //       this.selectedTheme = this.themeService.getCurrentTheme();
  //   } else {
  //       this.themeService.applyTheme(theme);
  //       this.isSystemTheme = false;
  //       this.selectedTheme = theme;
  //   }
  // }

  // getThemeIcon(): string {
  //   if (this.isSystemTheme) {
  //     return 'computer'; //  Иконка для системной темы
  //   }
  //   return this.selectedTheme === 'dark-mode' ? 'dark_mode' : 'light_mode';
  // }
}
