import { Router, RouterLink } from '@angular/router';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Return } from '../../helpers/Return';
import { Location } from '@angular/common';

@Return()
@Component({
  selector: 'app-devs',
  templateUrl: './dev.component.html',
  styleUrls: ['./dev.component.scss'],
  imports: [RouterLink, MatButtonModule]
})
export class DevComponent {
  goBack!: () => void;
  constructor(public router: Router, public location: Location) { }
}
