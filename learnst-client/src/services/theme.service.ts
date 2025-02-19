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
      preview: '#ffffff',
      displayName: 'Светлая тема'
    },
    {
      id: 'dark',
      premium: false,
      preview: '#313338',
      displayName: 'Тёмная тема'
    },
    {
      premium: true,
      id: 'mint-apple',
      preview: '#2b2d31',
      displayName: 'Мятное яблоко',
    },
    {
      premium: true,
      preview: '#9eca67',
      id: 'citrus-sherbet',
      displayName: 'Цитрусовый щербет'
    },
  ];

  currentTheme = signal<Theme>(this.themes[0]);

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
