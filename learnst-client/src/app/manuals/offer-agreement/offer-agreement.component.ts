import { Component } from '@angular/core';
import { Return } from '../../../helpers/Return';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Return()
@Component({
  selector: 'app-offer-agreement',
  templateUrl: './offer-agreement.component.html',
  styleUrls: ['./offer-agreement.component.scss'],
  imports: [RouterLink, MatButtonModule]
})
export class OfferAgreementComponent { }
