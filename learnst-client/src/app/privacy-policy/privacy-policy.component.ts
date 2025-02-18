import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { Return } from '../../helpers/Return';

@Return()
@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  imports: [RouterLink, MatButtonModule]
})
export class PrivacyPolicyComponent {
  goBack!: () => void;

  constructor(public router: Router, public location: Location) { }
}
