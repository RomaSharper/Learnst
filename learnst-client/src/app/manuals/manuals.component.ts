import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-manuals',
  templateUrl: './manuals.component.html',
  styleUrls: ['./manuals.component.scss'],
  imports: [
    RouterModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule
  ],
})
export class ManualsComponent {
  links = [
    { path: '/manuals/privacypolicy', title: 'Конфиденциальность' },
    { path: '/manuals/termsofuse', title: 'Условия использования' },
    { path: '/manuals/oferta', title: 'Публичная оферта' },
    { path: '/manuals/subscription', title: 'О подписке' },
    { path: '/manuals/contacts', title: 'Контакты' }
  ];
}
