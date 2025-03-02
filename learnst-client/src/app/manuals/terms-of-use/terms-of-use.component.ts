import { RouterLink } from '@angular/router';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-terms-of-use',
  templateUrl: './terms-of-use.component.html',
  imports: [RouterLink, MatButtonModule]
})
export class TermsOfUseComponent { }
