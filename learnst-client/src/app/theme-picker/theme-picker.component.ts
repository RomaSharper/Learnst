import {Component, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {MatTooltipModule} from '@angular/material/tooltip';
import {NoDownloadingDirective} from '../../directives/no-downloading.directive';
import {AlertService} from '../../services/alert.service';
import {AuthService} from '../../services/auth.service';
import {ThemeService} from '../../services/theme.service';

@Component({
  selector: 'app-theme-picker',
  templateUrl: './theme-picker.component.html',
  styleUrls: ['./theme-picker.component.scss'],
  imports: [MatTooltipModule, NoDownloadingDirective]
})
export class ThemePickerComponent {
  private authService = inject(AuthService);
  // Используем toSignal для автоматической отписки
  user = toSignal(this.authService.getUser());
  private alertService = inject(AlertService);
  private themeService = inject(ThemeService);
  // Получаем прямую ссылку на сигнал из сервиса
  currentTheme = this.themeService.currentTheme;

  themes = this.themeService.getThemes();

  isThemeSelected(themeId: string): boolean {
    return this.currentTheme().id === themeId;
  }

  selectTheme(themeId: string): void {
    if (this.user()?.theme?.id !== themeId)
      this.themeService.setTheme(themeId).subscribe({
        error: err => this.alertService.showSnackBar(err.message)
      });
  }
}
