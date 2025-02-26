import { Component } from '@angular/core';

@Component({
  selector: 'app-offer-agreement',
  templateUrl: './offer-agreement.component.html',
  styleUrls: ['./offer-agreement.component.scss']
})
export class OfferAgreementComponent {
  currentDate = new Date(2025, 1, 26).toLocaleDateString();
}
