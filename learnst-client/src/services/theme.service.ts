import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private _isDarkTheme = new BehaviorSubject<boolean>(false);
  isDarkTheme$ = this._isDarkTheme.asObservable();

  private readonly THEME_KEY = 'theme';  //  Добавлено для хранения выбранной темы
  private currentTheme: string = 'light-mode'; //  Добавлено для хранения текущей темы

  constructor() {
    this.loadTheme();
  }

  private loadTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    if (savedTheme) {
      this.currentTheme = savedTheme;
      this._isDarkTheme.next(savedTheme === 'dark-mode');
      this.applyTheme(savedTheme);
    } else {
      this.setSystemTheme();
    }
  }

  setDarkTheme(isDark: boolean): void {
    this._isDarkTheme.next(isDark);
    this.currentTheme = isDark ? 'dark-mode' : 'light-mode';
    localStorage.setItem(this.THEME_KEY, this.currentTheme);
    this.applyTheme(this.currentTheme);
  }

  applyTheme(themeClass: string): void {
    this.currentTheme = themeClass;  //  Обновляем текущую тему
    document.documentElement.classList.remove('light-mode', 'dark-mode');
    document.documentElement.classList.add(themeClass);
    localStorage.setItem(this.THEME_KEY, themeClass);
  }

  setSystemTheme(): void {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.currentTheme = prefersDark ? 'dark-mode' : 'light-mode';
    this.setDarkTheme(prefersDark);
  }

  getCurrentTheme(): string {
    return this.currentTheme;
  }
}
