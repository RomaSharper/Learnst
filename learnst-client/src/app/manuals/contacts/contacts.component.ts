import { Component, inject } from '@angular/core';
import { Return } from '../../../helpers/Return';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ClipboardService } from '../../../services/clipboard.service';
import { AlertService } from '../../../services/alert.service';
import { MatIconModule } from '@angular/material/icon';

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
    MatFormFieldModule
  ]
})
export class ContactsComponent {
  private alertService = inject(AlertService);
  private clipboardService = inject(ClipboardService);

  copyToClipboard(value: string, label: string) {
    this.clipboardService.copy({
      type: 'text/plain',
      blob: new Blob([value], { type: 'text/plain' })
    })
    .then(() => this.alertService.showSnackBar(`Поле ${label} успешно скопировано`))
    .catch(err => console.error('Копирование в буфер обмена не удалось: ', err));
  }
}
