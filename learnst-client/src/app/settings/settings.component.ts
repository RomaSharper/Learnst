import {Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatSliderModule} from '@angular/material/slider';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {ThemeService} from '../../services/theme.service';
import {AudioService} from '../../services/audio.service';
import {DeviceService} from '../../services/device.service';
import {DeviceType} from '../../models/DeviceType';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {AlertService} from '../../services/alert.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatIconModule,
    MatCardModule,
    MatSliderModule,
    MatButtonModule,
    MatSlideToggleModule
  ]
})
export class SettingsComponent {
  themeService = inject(ThemeService);
  audioService = inject(AudioService);
  deviceService = inject(DeviceService);
  private alertService = inject(AlertService);

  get isDesktop(): boolean {
    return this.deviceService.getDeviceType() === DeviceType.Desktop;
  }

  setVolumeFromEvent(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value);
    if (!this.audioService.setVolume(value))
      this.alertService.showSnackBar('Не удалось изменить звук (неверное значение)');
  }
}
