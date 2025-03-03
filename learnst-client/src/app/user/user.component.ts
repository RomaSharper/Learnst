import { Location } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { NoDownloadingDirective } from '../../directives/NoDownloadingDirective';
import { PlaceholderImageDirective } from '../../directives/PlaceholderImageDirective';
import { SocialMediaPlatformHelper } from '../../helpers/SocialMediaPlatformHelper';
import { User } from '../../models/User';
import { DateRangePipe } from '../../pipes/date.range.pipe';
import { AuthService } from '../../services/auth.service';
import { UsersService } from '../../services/users.service';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AlertService } from '../../services/alert.service';
import { Return } from '../../helpers/Return';
import { finalize } from 'rxjs';
import { PluralPipe } from '../../pipes/plural.pipe';

@Return()
@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  imports: [
    PluralPipe,
    FormsModule,
    MatIconModule,
    MatCardModule,
    DateRangePipe,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    MatGridListModule,
    NoDownloadingDirective,
    MatProgressSpinnerModule,
    PlaceholderImageDirective
  ]
})
export class UserComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private usersService = inject(UsersService);

  date = new Date();
  goBack!: () => void;
  loading = signal(true);
  followersCount = signal(0);
  isFollowing = signal(false);
  user = signal<User | null>(null);
  currentUser = signal<User | null>(null);

  SocialMediaPlatformHelper = SocialMediaPlatformHelper;

  constructor(public router: Router, public location: Location) { }

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('userId')!;

    this.authService.getUser().subscribe(currentUser => {
      if (currentUser && currentUser.id === userId) {
        this.router.navigate(['/me'], { replaceUrl: true });
        return;
      }

      this.currentUser.set(currentUser);
      this.usersService.getUserById(userId).subscribe(user => {
        this.user.set(user);

        if (currentUser)
          this.usersService.getFollowers(user.id!).subscribe(followers => {
            this.isFollowing.set(followers.some(f => f.id === currentUser.id));
          });

        // Обновить счетчики
        this.updateCounters(user.id!);
        this.loading.set(false);
      });
    });
  }

  handleFollow(): void {
    if (!this.currentUser() || !this.user()) return;

    const currentUserId = this.currentUser()!.id!;
    const targetUserId = this.user()!.id!;

    const action = this.isFollowing()
      ? this.usersService.unfollowUser(currentUserId, targetUserId)
      : this.usersService.followUser(currentUserId, targetUserId);

    action.pipe(
      finalize(() => {
        this.updateCounters(targetUserId);
        this.refreshUserData(); // Добавляем обновление данных
      })
    ).subscribe({
      next: () => {
        this.isFollowing.update(v => !v);
        this.alertService.showSnackBar('Успешно обновлено');
      },
      error: err => {
        console.error(err);
        this.alertService.showSnackBar('Ошибка обновления');
      }
    });
  }

  private refreshUserData(): void {
    const userId = this.user()?.id!;
    this.usersService.getUserById(userId).subscribe(user => {
      this.user.set(user);
      this.updateCounters(userId);
    });
  }

  private updateCounters(userId: string): void {
    this.usersService.getFollowersCount(userId).subscribe(count =>
      this.followersCount.set(count));
  }
}
