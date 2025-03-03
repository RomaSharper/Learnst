import { RouterLink } from '@angular/router';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-terms-of-use',
  templateUrl: './terms-of-use.component.html',
  imports: [RouterLink, MatCardModule, MatButtonModule]
})
export class TermsOfUseComponent { }
