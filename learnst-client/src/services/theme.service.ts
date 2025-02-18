// import { Injectable } from '@angular/core';
// import { baseThemes, premiumThemes } from '../styles/themes';
// import { Theme } from '../models/Theme';

// @Injectable({
//   providedIn: 'root',
// })
// export class ThemeService {
//   private readonly THEME_KEY = 'theme';
//   private readonly DARK_MODE_KEY = 'isDarkMode';
//   public static readonly THEMES: Theme[] = [...baseThemes, ...premiumThemes];

//   constructor() {
//     this.initializeTheme();
//   }

//   private initializeTheme() {
//     const savedTheme = localStorage.getItem(this.THEME_KEY);
//     const savedIsDark = localStorage.getItem(this.DARK_MODE_KEY) ?? false;

//     if (savedTheme)
//       this.applyTheme(savedTheme);
//     else
//       this.setSystemTheme();
//   }

//   private setSystemTheme(): void {
//     const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
//     const systemIsDark = darkQuery.matches;
//     this.applyTheme(systemIsDark ? 'dark-mode' : 'light-mode');

//     darkQuery.addEventListener('change', e =>
//       this.applyTheme(e.matches ? 'dark-mode' : 'light-mode')
//     );
//   }

//   applyTheme(themeName: string): void {
//     const html = document.documentElement;
//     const theme = ThemeService.THEMES.find(t => t.name === themeName);

//     if (!theme) return;

//     // Обновляем состояние
//     localStorage.setItem(this.THEME_KEY, themeName);
//     localStorage.setItem(this.DARK_MODE_KEY, JSON.stringify(theme.type === 'dark'));

//     // Удаляем все темы
//     this.removeAllThemes(html);

//     // Добавляем новую тему
//     html.classList.add(themeName);
//     html.setAttribute('data-theme', themeName);

//     // Применяем стили (важно: используем CSS переменные)
//     html.style.setProperty('--primary-color', theme.primaryColor);
//     html.style.setProperty('--surface-color', theme.surfaceColor);
//     html.style.setProperty('--on-primary-color', theme.onPrimaryColor);
//     html.style.setProperty('--text-color', theme.textColor); // Добавлено
//     html.style.setProperty('--border-color', theme.borderColor); // Добавлено
//     html.style.setProperty('--shadow-color', theme.shadowColor); // Добавлено
//     html.style.setProperty('--hover-bg', theme.hoverBg); // Добавлено
//     html.style.setProperty('--active-bg', theme.activeBg); // Добавлено
//     html.style.setProperty('--focus-border', theme.focusBorder); // Добавлено
//     html.style.setProperty('--gradient', theme.gradient);
//   }

//   private isDarkTheme(themeName: string): boolean {
//     return themeName === 'dark-mode' || themeName.endsWith('-dark');
//   }

//   private removeAllThemes(html: HTMLElement) {
//     ThemeService.THEMES.forEach(theme => html.classList.remove(theme.name));
//   }
// }

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private _isDarkTheme = new BehaviorSubject<boolean>(false); // По умолчанию темная тема
  isDarkTheme$ = this._isDarkTheme.asObservable();

  constructor() {
    //  Загрузка темы из localStorage при инициализации (опционально)
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme)
      this._isDarkTheme.next(storedTheme === 'dark-mode');
    else
      //  Если в localStorage ничего нет, применяем системную настройку
      this.setSystemTheme();
  }

  //  Метод для установки темы
  setDarkTheme(isDark: boolean): void {
    this._isDarkTheme.next(isDark);
    localStorage.setItem('theme', isDark ? 'dark-mode' : 'light-mode'); // Сохранение в localStorage (опционально)
    this.applyTheme(isDark ? 'dark-mode' : 'light-mode'); // Применение CSS класса
  }

  //  Метод для применения темы.  Этот метод, вероятно, самый важный
  applyTheme(themeClass: string): void {
    document.documentElement.classList.remove('light-mode', 'dark-mode');
    document.documentElement.classList.add(themeClass);
    localStorage.setItem('theme', themeClass);
  }

  //  Метод для установки темы, соответствующей системным настройкам (light/dark)
  setSystemTheme(): void {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setDarkTheme(prefersDark);
  }
}
