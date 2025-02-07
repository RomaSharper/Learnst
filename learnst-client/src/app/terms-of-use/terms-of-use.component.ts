import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Location } from '@angular/common';
import { Return } from '../../helpers/Return';

@Return()
@Component({
  selector: 'app-terms-of-use',
  templateUrl: './terms-of-use.component.html',
  styleUrls: ['./terms-of-use.component.less'],
  imports: [MatButtonModule]
})
export class TermsOfUseComponent {
  goBack!: () => void;
  
  constructor(public router: Router, public location: Location) { }
}
