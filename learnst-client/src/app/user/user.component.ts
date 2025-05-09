import {Location, NgClass} from '@angular/common';
import {Component, inject, OnInit, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import {ActivatedRoute, Router} from '@angular/router';
import {finalize} from 'rxjs';
import {NoDownloadingDirective} from '../../directives/no-downloading.directive';
import {PlaceholderImageDirective} from '../../directives/placeholder-image.directive';
import {Return} from '../../helpers/Return';
import {SocialMediaPlatformHelper} from '../../helpers/SocialMediaPlatformHelper';
import {User} from '../../models/User';
import {DateRangePipe} from '../../pipes/date.range.pipe';
import {AlertService} from '../../services/alert.service';
import {AuthService} from '../../services/auth.service';
import {UsersService} from '../../services/users.service';
import {StatusHelper} from '../../helpers/StatusHelper';
import {Status} from '../../enums/Status';
import {Role} from '../../enums/Role';
import {RuDatePipe} from '../../pipes/ru.date.pipe';
import {MediumScreenSupport} from '../../helpers/MediumScreenSupport';
import {ClipboardService} from '../../services/clipboard.service';
import {catchError} from 'rxjs/operators';

@Return()
@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  imports: [
    NgClass,
    RuDatePipe,
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
export class UserComponent extends MediumScreenSupport implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private usersService = inject(UsersService);
  private clipboardService = inject(ClipboardService);

  goBack!: () => void;
  date = new Date();
  created = signal(0);
  enrolled = signal(0);
  completed = signal(0);
  loading = signal(true);
  followersCount = signal(0);
  isFollowing = signal(false);
  user = signal<User | null>(null);
  currentUser = signal<User | null>(null);
  protected readonly SocialMediaPlatformHelper = SocialMediaPlatformHelper;

  constructor(public router: Router, public location: Location) {
    super();
  }

  get isVeteran(): boolean {
    if (!this.user()?.createdAt) return false;
    const registrationDate = new Date(this.user()!.createdAt);
    const currentDate = new Date();
    const diffTime = currentDate.getTime() - registrationDate.getTime();
    const diffYears = diffTime / (1000 * 3600 * 24 * 365);
    return diffYears >= 1;
  }

  ngOnInit(): void {
    const userName = this.route.snapshot.paramMap.get('userName')!;

    this.authService.getUser().subscribe(currentUser => {
      if (currentUser && currentUser.username === userName) {
        this.router.navigate(['/me'], {replaceUrl: true});
        return;
      }

      this.currentUser.set(currentUser);
      this.usersService.getUserByName(userName).pipe(
        catchError(err => {
          this.loading.set(false);
          throw err;
        })
      ).subscribe(user => {
        this.user.set(user);
        this.usersService.getUserStats(user?.id!).subscribe(userStats => {
          this.created.set(userStats.created);
          this.enrolled.set(userStats.enrolled);
          this.completed.set(userStats.completed);
        });

        if (currentUser)
          this.usersService.getFollowers(user?.id!).subscribe(followers =>
            this.isFollowing.set(followers.some(f => f.id === currentUser.id)));

        // Обновить счетчики
        this.updateCounters(user?.id!);
        this.loading.set(false);
      });
    });
  }

  copy(text: string): void {
    this.clipboardService.copyText(text, this.alertService);
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

  protected readonly StatusHelper = StatusHelper;
  protected readonly Status = Status;
  protected readonly Role = Role;
}
