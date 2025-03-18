import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { NoDownloadingDirective } from '../../directives/no-downloading.directive';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
  imports: [RouterLink, MatButtonModule, NoDownloadingDirective]
})
export class NotFoundComponent { }
