
import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { NoDownloadingDirective } from '../../directives/NoDownloadingDirective';
import { PlaceholderImageDirective } from '../../directives/PlaceholderImageDirective';
import { SocialMediaPlatformHelper } from '../../helpers/SocialMediaPlatformHelper';
import { User } from '../../models/User';
import { DateRangePipe } from '../../pipes/date.range.pipe';
import { AuthService } from '../../services/auth.service';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.less'],
  imports: [
    FormsModule,
    MatCardModule,
    DateRangePipe,
    MatInputModule,
    MatButtonModule,
    MatGridListModule,
    NoDownloadingDirective,
    MatProgressSpinnerModule,
    PlaceholderImageDirective,
  ]
})
export class UserComponent implements OnInit {
  user?: User;
  loading = true;
  date = new Date();
  errorMessage = '';

  SocialMediaPlatformHelper = SocialMediaPlatformHelper;

  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) { }

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('userId')!;

    this.authService.getUser().subscribe(user => {
      if (user && user.id === userId) {
        this.router.navigate(['/me'], { replaceUrl: true });
        return;
      }

      this.usersService.getUserById(userId).pipe(
        catchError(_err => {
          return of(undefined);
        })
      ).subscribe(user => {
        if (!user)
          this.errorMessage = 'Пользователь не найден';
        else
          this.user = user;
        this.loading = false;
      });
    });
  }

  goBack(): void {
    if (window.history.length > 0) this.location.back();
    else this.router.navigate(['/']);
  }
}
