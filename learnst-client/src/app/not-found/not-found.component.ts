import { RouterLink } from '@angular/router';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { NoDownloadingDirective } from '../../directives/NoDownloadingDirective';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
  imports: [RouterLink, MatButtonModule, NoDownloadingDirective]
})
export class NotFoundComponent { }
