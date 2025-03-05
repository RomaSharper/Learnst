import { Component, inject, effect } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../services/auth.service';
import { NoDownloadingDirective } from '../../directives/NoDownloadingDirective';
import { toSignal } from '@angular/core/rxjs-interop';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-theme-picker',
  templateUrl: './theme-picker.component.html',
  styleUrls: ['./theme-picker.component.scss'],
  imports: [MatTooltipModule, NoDownloadingDirective]
})
export class ThemePickerComponent {
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private themeService = inject(ThemeService);

  // Используем toSignal для автоматической отписки
  user = toSignal(this.authService.getUser());

  // Получаем прямую ссылку на сигнал из сервиса
  currentTheme = this.themeService.currentTheme;

  themes = this.themeService.getThemes();

  // Эффект для принудительного обновления при изменении темы
  private themeEffect = effect(() => {
    this.currentTheme(); // Принудительно триггерим изменение
  });

  isThemeSelected(themeId: string): boolean {
    return this.currentTheme().id === themeId;
  }

  selectTheme(themeId: string): void {
    if (this.user()?.theme?.id !== themeId)
      this.themeService.setTheme(themeId).subscribe({
        error: err => this.alertService.showSnackBar(err)
      });
  }
}
