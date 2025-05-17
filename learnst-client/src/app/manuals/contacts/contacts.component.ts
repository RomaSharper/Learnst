import {Component, inject} from '@angular/core';
import {Return} from '../../../helpers/Return';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {RouterLink} from '@angular/router';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {ClipboardService} from '../../../services/clipboard.service';
import {AlertService} from '../../../services/alert.service';
import {MatIconModule} from '@angular/material/icon';
import {MediumScreenSupport} from '../../../helpers/MediumScreenSupport';
import {MatTooltip} from '@angular/material/tooltip';

@Return()
@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  imports: [
    RouterLink,
    MatIconModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatTooltip
  ]
})
export class ContactsComponent extends MediumScreenSupport {
  clipboardService = inject(ClipboardService);
  private alertService = inject(AlertService);

  copyToClipboard(value: string, label?: string) {
    this.clipboardService.copyText(value, this.alertService, `Поле ${label} успешно скопировано`);
  }
}
