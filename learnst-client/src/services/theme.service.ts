import { effect, Inject, inject, Injectable, OnInit, signal } from '@angular/core';
import { FrontendTheme } from '../models/FrontendTheme';
import { AuthService } from './auth.service';
import { User } from '../models/User';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private user: User | null = null;
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  
  private readonly themes: FrontendTheme[] = [
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
      displayName: 'Мятное яблоко',
      preview: ' linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), linear-gradient(rgb(86, 182, 159) 6.15%, rgb(99, 188, 97) 48.7%, rgb(158, 202, 103) 93.07%)'
    },
    {
      premium: true,
      id: 'citrus-sherbet',
      displayName: 'Цитрусовый щербет',
      preview: 'linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), linear-gradient(rgb(243, 179, 54) 31.1%, rgb(238, 133, 88) 67.09%)'
    },
    {
      premium: true,
      id: 'retro-raincloud',
      displayName: 'Ретротуча',
      preview: 'linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), linear-gradient(148.71deg, rgb(58, 124, 161) 5.64%, rgb(127, 126, 185) 26.38%, rgb(127, 126, 185) 49.92%, rgb(58, 124, 161) 73.12%)'
    },
    {
      id: 'hanami',
      premium: true,
      displayName: 'Ханами',
      preview: 'linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), linear-gradient(38.08deg, rgb(239, 170, 179) 3.56%, rgb(239, 214, 150) 35.49%, rgb(166, 218, 162) 68.78%)'
    },
    {
      id: 'sunrise',
      premium: true,
      displayName: 'Рассвет',
      preview: 'linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), linear-gradient(154.19deg, rgb(159, 65, 117) 8.62%, rgb(196, 144, 100) 48.07%, rgb(166, 149, 61) 76.04%)'
    },
    {
      premium: true,
      id: 'cotton-candy',
      displayName: 'Сладкая вата',
      preview: 'linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), linear-gradient(180.14deg, rgb(244, 171, 184) 8.5%, rgb(177, 194, 252) 94.28%)'
    },
    {
      premium: true,
      id: 'lofi-vibes',
      displayName: 'Атмосфера Lo-Fi',
      preview: 'linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), linear-gradient(179.52deg, rgb(164, 192, 247) 7.08%, rgb(169, 228, 232) 34.94%, rgb(176, 226, 184) 65.12%, rgb(207, 223, 162) 96.23%)'
    },
    {
      premium: true,
      id: 'desert-khaki',
      displayName: 'Пустынный хаки',
      preview: 'linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), linear-gradient(38.99deg, rgb(231, 219, 208) 12.92%, rgb(223, 208, 178) 32.92%, rgb(224, 214, 163) 52.11%)'
    },
    {
      id: 'sunset',
      premium: true,
      displayName: 'Закат',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(141.68deg, rgb(72, 40, 140) 27.57%, rgb(219, 127, 75) 71.25%)'
    },
    {
      premium: true,
      id: 'chroma-glow',
      displayName: 'Интенсивное сияние',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(128.92deg, rgb(14, 181, 191) 3.94%, rgb(76, 12, 224) 26.1%, rgb(163, 8, 167) 39.82%, rgb(154, 83, 255) 56.89%, rgb(33, 139, 224) 76.45%)'
    },
    {
      id: 'forest',
      premium: true,
      displayName: 'Лес',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(162.27deg, rgb(20, 34, 21) 11.2%, rgb(45, 77, 57) 29.93%, rgb(69, 76, 50) 48.64%, rgb(90, 124, 88) 67.85%, rgb(169, 142, 75) 83.54%)'
    },
    {
      premium: true,
      id: 'crimson-moon',
      displayName: 'Багровая луна',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(64.92deg, rgb(180, 12, 12) 16.17%, rgb(58, 10, 10) 72%)'
    },
    {
      premium: true,
      id: 'midnight-blurple',
      displayName: 'Полуночный синелетовый',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(48.17deg, rgb(83, 72, 202) 11.21%, rgb(20, 7, 48) 61.92%)'
    },
    {
      id: 'mars',
      premium: true,
      displayName: 'Марс',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(170.82deg, rgb(137, 82, 64) 14.61%, rgb(143, 67, 67) 74.62%)'
    },
    {
      id: 'dusk',
      premium: true,
      displayName: 'Сумерки',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(rgb(102, 80, 105) 12.84%, rgb(145, 163, 209) 85.99%)'
    },
    {
      premium: true,
      id: 'under-the-sea',
      displayName: 'Морские глубины',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(179.14deg, rgb(100, 121, 98) 1.91%, rgb(88, 133, 117) 48.99%, rgb(106, 132, 130) 96.35%)'
    },
    {
      premium: true,
      id: 'retro-storm',
      displayName: 'Ретрогроза',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(148.71deg, rgb(58, 124, 161) 5.64%, rgb(88, 87, 154) 26.38%, rgb(88, 87, 154) 49.92%, rgb(58, 124, 161) 73.12%)'
    },
    {
      premium: true,
      id: 'neon-nights',
      displayName: 'Неоновые ночи',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(rgb(1, 168, 158) 0%, rgb(125, 96, 186) 50%, rgb(180, 56, 152) 100%)'
    },
    {
      premium: true,
      id: 'strawberry-lemonade',
      displayName: 'Земляничный лимонад',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(161.03deg, rgb(175, 26, 108) 18.79%, rgb(194, 107, 32) 49.76%, rgb(231, 165, 37) 80.72%)'
    },
    {
      id: 'aurora',
      premium: true,
      displayName: 'Аврора',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(239.16deg, rgb(6, 32, 83) 10.39%, rgb(25, 31, 187) 26.87%, rgb(19, 146, 154) 48.31%, rgb(33, 133, 115) 64.98%, rgb(5, 26, 129) 92.5%)'
    },
    {
      id: 'sepia',
      premium: true,
      displayName: 'Сепия',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(69.98deg, rgb(133, 118, 100) 14.14%, rgb(91, 68, 33) 60.35%)'
    },
    {
      premium: true,
      id: 'blurple-twilight',
      displayName: 'Синелетовые сумерки',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(47.61deg, rgb(44, 63, 231) 11.18%, rgb(38, 29, 131) 64.54%)'
    },
  ];

  currentTheme = signal<FrontendTheme>(this.themes[0]);

  constructor() {
    this.authService.getUser().subscribe(user => {
      this.user = user;
      if (this.user?.theme) this.setTheme(this.user.theme.id);
    });
  }

  getThemes(): FrontendTheme[] {
    return this.themes;
  }

  setTheme(themeId: string) {
    if (!this.user?.id) {
      this.alertService.showSnackBar('Пользователь не авторизован');
      return;
    }

    this.alertService.openMessageDialog('Сообщение', this.user.themeId);

    const theme = this.themes.find(t => t.id === themeId);
    if (theme)
      this.http.post<any>(`${environment.apiBaseUrl}/theme/${this.user.id}/${themeId}`, null).subscribe({
        next: response => {
          console.log(response);
          this.currentTheme.set(theme);
          // this.authService.setUser(response);
          this.alertService.showSnackBar(response.message || "Тема была успешно изменена " + response.themeId);
        },
        error: error => {
          console.error(error);
          this.alertService.showSnackBar("Произошла ошибка при попытке изменить тему");
        }
      });
  }

  updateThemeClass = effect(() => {
    const theme = this.currentTheme();
    document.body.classList.remove(...this.themes.map(t => `${t.id}-theme`));
    document.body.classList.add(`${theme.id}-theme`);
  });
}
