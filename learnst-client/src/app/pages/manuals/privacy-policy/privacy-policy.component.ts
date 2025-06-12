import {Component} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {RouterLink} from '@angular/router';
import {MediumScreenSupport} from '../../../../data/helpers/MediumScreenSupport';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule
  ]
})
export class PrivacyPolicyComponent extends MediumScreenSupport {
}
