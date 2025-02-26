import { Component } from '@angular/core';

@Component({
  selector: 'app-delivery-info',
  templateUrl: './delivery-info.component.html',
  styleUrls: ['./delivery-info.component.scss']
})
export class DeliveryInfoComponent {
  readonly steps = [
    'Оплатите выбранный тарифный план',
    'Мгновенная активация премиум-статуса',
    'Уведомление на email с деталями подписки',
    'Необходимо продление при истечении срока подписки'
  ];
}
