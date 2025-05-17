import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { effect, Injectable, signal, DestroyRef, inject } from '@angular/core';
import { FrontendTheme } from '../models/FrontendTheme';
import { AuthService } from './auth.service';
import { User } from '../models/User';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { AlertService } from './alert.service';
import { SignalRService } from './signalr.service';
import { Observable, Subject } from 'rxjs';
import {LogService} from './log.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private user: User | null = null;
  private http = inject(HttpClient);
  private logService = inject(LogService);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private signalr = inject(SignalRService);
  private alertService = inject(AlertService);

  private readonly themes: FrontendTheme[] = [
    {
      id: 'light',
      dark: false,
      preview: '#ffffff',
      displayName: 'Светлая тема'
    },
    {
      id: 'dark',
      dark: true,
      preview: '#313338',
      displayName: 'Тёмная тема'
    },
    {
      dark: false,
      id: 'mint-apple',
      displayName: 'Мятное яблоко',
      preview: ' linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), linear-gradient(rgb(86, 182, 159) 6.15%, rgb(99, 188, 97) 48.7%, rgb(158, 202, 103) 93.07%)'
    },
    {
      dark: false,
      id: 'citrus-sherbet',
      displayName: 'Цитрусовый щербет',
      preview: 'linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), linear-gradient(rgb(243, 179, 54) 31.1%, rgb(238, 133, 88) 67.09%)'
    },
    {
      dark: false,
      id: 'retro-raincloud',
      displayName: 'Ретротуча',
      preview: 'linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), linear-gradient(148.71deg, rgb(58, 124, 161) 5.64%, rgb(127, 126, 185) 26.38%, rgb(127, 126, 185) 49.92%, rgb(58, 124, 161) 73.12%)'
    },
    {
      dark: false,
      id: 'hanami',
      displayName: 'Ханами',
      preview: 'linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), linear-gradient(38.08deg, rgb(239, 170, 179) 3.56%, rgb(239, 214, 150) 35.49%, rgb(166, 218, 162) 68.78%)'
    },
    {
      dark: false,
      id: 'sunrise',
      displayName: 'Рассвет',
      preview: 'linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), linear-gradient(154.19deg, rgb(159, 65, 117) 8.62%, rgb(196, 144, 100) 48.07%, rgb(166, 149, 61) 76.04%)'
    },
    {
      dark: false,
      id: 'cotton-candy',
      displayName: 'Сладкая вата',
      preview: 'linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), linear-gradient(180.14deg, rgb(244, 171, 184) 8.5%, rgb(177, 194, 252) 94.28%)'
    },
    {
      dark: false,
      id: 'lofi-vibes',
      displayName: 'Атмосфера Lo-Fi',
      preview: 'linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), linear-gradient(179.52deg, rgb(164, 192, 247) 7.08%, rgb(169, 228, 232) 34.94%, rgb(176, 226, 184) 65.12%, rgb(207, 223, 162) 96.23%)'
    },
    {
      dark: false,
      id: 'desert-khaki',
      displayName: 'Пустынный хаки',
      preview: 'linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), linear-gradient(38.99deg, rgb(231, 219, 208) 12.92%, rgb(223, 208, 178) 32.92%, rgb(224, 214, 163) 52.11%)'
    },
    {
      dark: true,
      id: 'sunset',
      displayName: 'Закат',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(141.68deg, rgb(72, 40, 140) 27.57%, rgb(219, 127, 75) 71.25%)'
    },
    {
      dark: true,
      id: 'chroma-glow',
      displayName: 'Интенсивное сияние',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(128.92deg, rgb(14, 181, 191) 3.94%, rgb(76, 12, 224) 26.1%, rgb(163, 8, 167) 39.82%, rgb(154, 83, 255) 56.89%, rgb(33, 139, 224) 76.45%)'
    },
    {
      dark: true,
      id: 'forest',
      displayName: 'Лес',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(162.27deg, rgb(20, 34, 21) 11.2%, rgb(45, 77, 57) 29.93%, rgb(69, 76, 50) 48.64%, rgb(90, 124, 88) 67.85%, rgb(169, 142, 75) 83.54%)'
    },
    {
      dark: true,
      id: 'crimson-moon',
      displayName: 'Багровая луна',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(64.92deg, rgb(180, 12, 12) 16.17%, rgb(58, 10, 10) 72%)'
    },
    {
      dark: true,
      id: 'midnight-blurple',
      displayName: 'Полуночный синелетовый',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(48.17deg, rgb(83, 72, 202) 11.21%, rgb(20, 7, 48) 61.92%)'
    },
    {
      id: 'mars',
      dark: true,
      displayName: 'Марс',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(170.82deg, rgb(137, 82, 64) 14.61%, rgb(143, 67, 67) 74.62%)'
    },
    {
      dark: true,
      id: 'dusk',
      displayName: 'Сумерки',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(rgb(102, 80, 105) 12.84%, rgb(145, 163, 209) 85.99%)'
    },
    {
      dark: true,
      id: 'under-the-sea',
      displayName: 'Морские глубины',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(179.14deg, rgb(100, 121, 98) 1.91%, rgb(88, 133, 117) 48.99%, rgb(106, 132, 130) 96.35%)'
    },
    {
      dark: true,
      id: 'retro-storm',
      displayName: 'Ретрогроза',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(148.71deg, rgb(58, 124, 161) 5.64%, rgb(88, 87, 154) 26.38%, rgb(88, 87, 154) 49.92%, rgb(58, 124, 161) 73.12%)'
    },
    {
      dark: true,
      id: 'neon-nights',
      displayName: 'Неоновые ночи',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(rgb(1, 168, 158) 0%, rgb(125, 96, 186) 50%, rgb(180, 56, 152) 100%)'
    },
    {
      dark: true,
      id: 'strawberry-lemonade',
      displayName: 'Земляничный лимонад',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(161.03deg, rgb(175, 26, 108) 18.79%, rgb(194, 107, 32) 49.76%, rgb(231, 165, 37) 80.72%)'
    },
    {
      dark: true,
      id: 'aurora',
      displayName: 'Аврора',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(239.16deg, rgb(6, 32, 83) 10.39%, rgb(25, 31, 187) 26.87%, rgb(19, 146, 154) 48.31%, rgb(33, 133, 115) 64.98%, rgb(5, 26, 129) 92.5%)'
    },
    {
      dark: true,
      id: 'sepia',
      displayName: 'Сепия',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(69.98deg, rgb(133, 118, 100) 14.14%, rgb(91, 68, 33) 60.35%)'
    },
    {
      dark: true,
      id: 'blurple-twilight',
      displayName: 'Синелетовые сумерки',
      preview: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(47.61deg, rgb(44, 63, 231) 11.18%, rgb(38, 29, 131) 64.54%)'
    },
  ];
  private readonly CURSOR_STORAGE_KEY = 'custom_cursors';

  currentTheme = signal<FrontendTheme>(this.themes[0]);
  cursorsEnabled = signal(localStorage.getItem(this.CURSOR_STORAGE_KEY) === 'on');

  constructor() {
    this.setupCursorsEffect();
    this.initializeSignalR();
    this.setupUserSubscription();
  }

  getThemes(): FrontendTheme[] {
    return this.themes;
  }

  setTheme(themeId: string, isInitialLoad = false): Observable<void> {
    const themeChangeSubject = new Subject<void>();

    const theme = this.themes.find(t => t.id === themeId);
    if (!theme) {
      themeChangeSubject.error('Тема не найдена');
      return themeChangeSubject.asObservable();
    }

    if (!this.user?.id) {
      this.setLocalTheme(themeId);
      themeChangeSubject.next();
      themeChangeSubject.complete();
      return themeChangeSubject.asObservable();
    }

    this.http.post<any>(
      `${environment.apiBaseUrl}/theme/${this.user.id}/${themeId}`, null
    ).subscribe({
      next: () => {
        this.currentTheme.set(theme);
        if (!isInitialLoad)
          this.sendThemeUpdate(themeId);
        themeChangeSubject.next();
        themeChangeSubject.complete();
      },
      error: error => {
        this.logService.error(error);
        this.alertService.showSnackBar('Не удалось обновить тему');
        themeChangeSubject.error(error);
      }
    });

    return themeChangeSubject.asObservable();
  }

  setLocalTheme(themeId: string): void {
    const theme = this.themes.find(t => t.id === themeId);
    if (!theme) return;

    this.currentTheme.set(theme);
    document.body.classList.remove(...this.themes.map(t => `${t.id}-theme`));
    document.body.classList.add(`${theme.id}-theme`);
  }

  toggleCursors(enabled: boolean): void {
    this.cursorsEnabled.set(enabled);
  }

  updateThemeClass = effect(() => {
    const theme = this.currentTheme();
    document.body.classList.remove(...this.themes.map(t => `${t.id}-theme`));
    document.body.classList.add(`${theme.id}-theme`);
  });

  private setupCursorsEffect(): void {
    effect(() => {
      const enabled = this.cursorsEnabled();
      document.body.classList.toggle('custom-cursors', enabled);
      this.forceCursorUpdate();
      localStorage.setItem(this.CURSOR_STORAGE_KEY, enabled ? 'on' : 'off');
    });
  }

  private forceCursorUpdate(): void {
    const { style } = document.documentElement;
    style.setProperty('cursor', 'inherit', 'important');
    setTimeout(() => style.removeProperty('cursor'));
  }

  private sendThemeUpdate(themeId: string): void {
    if (this.user?.id)
      this.signalr.invoke('SendThemeUpdate', this.user.id, themeId);
  }

  private applyRemoteTheme(themeId: string): void {
    const theme = this.themes.find(t => t.id === themeId);
    if (theme && theme.id !== this.currentTheme().id) {
      this.currentTheme.set(theme);
      this.alertService.showSnackBar('Тема обновлена');
    }
  }

  private setupUserSubscription(): void {
    this.authService.getUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.user = user;
        if (user?.id) {
          this.joinUserGroup(user.id);
          if (user.theme) this.setTheme(user.theme.id, true);
        } else
          this.setLocalTheme('light');
      });
  }

  private initializeSignalR(): void {
    this.signalr.onThemeUpdate().subscribe((themeId: string) =>
      this.applyRemoteTheme(themeId));
  }

  private async joinUserGroup(userId: string): Promise<void> {
    try {
      await this.signalr.invoke('JoinUserGroup', userId);
    } catch (err) {
      setTimeout(() => this.joinUserGroup(userId), 2000);
    }
  }
}
