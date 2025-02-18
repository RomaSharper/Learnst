import { effect, Injectable, signal } from '@angular/core';
import { Theme } from '../models/Theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly themes: Theme[] = [
    {
      id: 'light',
      premium: false,
      primary: '#ffffff',
      displayName: 'Светлая тема'
    },
    {
      id: 'dark',
      premium: false,
      primary: '#313338',
      displayName: 'Тёмная тема'
    },
    {
      premium: true,
      id: 'mint-apple',
      primary: '#2b2d31',
      displayName: 'Мятное яблоко',
    },
    {
      premium: true,
      primary: '#9eca67',
      id: 'citrus-sherbet',
      displayName: 'Цитрусовый щербет'
    },
  ];

  currentTheme = signal<Theme>(this.themes[1]);

  getThemes(): Theme[] {
    return this.themes;
  }

  setTheme(themeId: string) {
    const theme = this.themes.find(t => t.id === themeId);
    if (theme) this.currentTheme.set(theme);
  }

  updateThemeClass = effect(() => {
    const theme = this.currentTheme();
    document.body.classList.remove(...this.themes.map(t => `${t.id}-theme`));
    document.body.classList.add(`${theme.id}-theme`);
  });
}
