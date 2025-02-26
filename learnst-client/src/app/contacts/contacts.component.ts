import { Component } from '@angular/core';

@Component({
  selector: 'app-contacts',
  standalone: false,

  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.scss'
})
export class ContactsComponent {
  readonly contacts = {
    inn: '761020396832',
    phone: '+7 (905) 134-37-81',
    email: 'oraclehub-tech@mail.ru',
    name: 'Шибалов Роман Николаевич',
    address: 'Российская Федерация, Ярославская область'
  };
}
