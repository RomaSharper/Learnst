import { Injectable } from '@angular/core';

export interface Theme {
  name: string;
  premium: boolean;
  gradient: string;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'theme';
  private readonly DARK_MODE_KEY = 'isDarkMode';
  private readonly BASE_THEMES = ['light-mode', 'dark-mode'];
  public readonly THEMES = this.BASE_THEMES.concat(this.getPremiumThemes());

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme() {
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    const savedIsDark = localStorage.getItem(this.DARK_MODE_KEY) ?? false;

    if (savedTheme) {
      this.applyTheme(savedTheme);
    } else {
      this.setSystemTheme();
    }
  }

  private setSystemTheme() {
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const systemIsDark = darkQuery.matches;
    this.applyTheme(systemIsDark ? 'dark-mode' : 'light-mode');

    darkQuery.addEventListener('change', e => {
      this.applyTheme(e.matches ? 'dark-mode' : 'light-mode');
    });
  }

  applyTheme(themeName: string) {
    const html = document.documentElement;
    const isDark = this.isDarkTheme(themeName);

    // Обновляем состояние
    localStorage.setItem(this.THEME_KEY, themeName);
    localStorage.setItem(this.DARK_MODE_KEY, JSON.stringify(isDark));

    // Удаляем все темы
    this.removeAllThemes(html);

    // Добавляем новую тему
    html.classList.add(themeName);
    html.setAttribute('data-theme', themeName);
  }

  private isDarkTheme(themeName: string): boolean {
    return themeName === 'dark-mode' || themeName.endsWith('-dark');
  }

  private removeAllThemes(html: HTMLElement) {
    const themes = [...this.BASE_THEMES, ...this.getPremiumThemes()];
    themes.forEach(theme => html.classList.remove(theme));
  }

  // Методы для работы с темами через CSS-классы
  getPremiumThemes(): string[] {
    return Array.from(document.documentElement.classList)
      .filter(c => c.startsWith('theme-'))
      .map(c => c.replace('theme-', ''));
  }
}
