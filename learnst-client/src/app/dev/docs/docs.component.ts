import { Component } from '@angular/core';
import { Return } from '../../../helpers/Return';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Return()
@Component({
  selector: 'app-docs',
  templateUrl: './docs.component.html',
  styleUrls: ['./docs.component.less'],
  imports: [RouterLink, MatButtonModule]
})
export class DocsComponent {
  goBack!: () => void;
  constructor(public router: Router, public location: Location) { }
}
