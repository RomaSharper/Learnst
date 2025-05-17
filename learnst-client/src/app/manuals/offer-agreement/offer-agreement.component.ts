import {Component} from '@angular/core';
import {Return} from '../../../helpers/Return';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MediumScreenSupport} from '../../../helpers/MediumScreenSupport';

@Return()
@Component({
  selector: 'app-offer-agreement',
  templateUrl: './offer-agreement.component.html',
  imports: [RouterLink, MatCardModule, MatButtonModule]
})
export class OfferAgreementComponent extends MediumScreenSupport {
}
