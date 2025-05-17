import {Component} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MediumScreenSupport} from '../../../helpers/MediumScreenSupport';

@Component({
  selector: 'app-delivery-info',
  templateUrl: './delivery-info.component.html',
  imports: [RouterLink, MatCardModule, MatButtonModule]
})
export class DeliveryInfoComponent extends MediumScreenSupport {
}
