import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { NoDownloadingDirective } from '../../directives/no-downloading.directive';
import { PlaceholderImageDirective } from '../../directives/placeholder-image.directive';
import { Level } from '../../enums/Level';
import { Role } from '../../enums/Role';
import { MediumScreenSupport } from '../../helpers/MediumScreenSupport';
import { Return } from '../../helpers/Return';
import { TagHelper } from '../../helpers/TagHelper';
import { getRussianPaginatorIntl } from '../../localization/russian.paginator.intl';
import { Activity } from '../../models/Activity';
import { User } from '../../models/User';
import { RuDatePipe } from '../../pipes/ru.date.pipe';
import { ActivitiesService } from '../../services/activities.service';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';

@Return()
@Component({
  selector: 'app-activities',
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.scss'],
  providers: [{ provide: MatPaginatorIntl, useValue: getRussianPaginatorIntl() }],
  imports: [
    RuDatePipe,
    RouterLink,
    FormsModule,
    CommonModule,
    MatIconButton,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatInputModule,
    MatButtonModule,
    MatPaginatorModule,
    NoDownloadingDirective,
    MatProgressSpinnerModule,
    PlaceholderImageDirective
  ]
})
export class ActivitiesComponent extends MediumScreenSupport implements OnInit {
  pageSize = 6;
  pageIndex = 0;
  loading = true;
  now = new Date();
  searchInput = '';
  searchQuery = '';
  tags: string[] = [];
  user: User | null = null;
  level: string | null = null;
  activities: Activity[] = [];
  pageSizeOptions = [6, 12, 24];
  paginatedActivities: Activity[] = [];

  Role = Role;

  constructor(
    private activitiesService: ActivitiesService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private alertService: AlertService,
    public location: Location,
    public router: Router
  ) {
    super();
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['search_query'] || '';
      this.tags = params['tags'] ? params['tags'].split(',').map((tag: string) => TagHelper.toDisplayFormat(tag)) : [];
      this.level = params['level'] || null; // Чтение параметра level
      this.searchInput = this.searchQuery + (this.tags.length ? ' #' + this.tags.join(' #') : '').trim();
      this.filterActivities();
    });

    this.authService.getUser().subscribe(user => {
      this.user = user;
      this.loadActivities();
    });

    setInterval(() => {
      this.now = new Date();
    }, 60000);
  }

  // Обработка поиска
  onSearch(): void {
    this.parseSearchInput();
    this.updateUrl();
    this.filterActivities();
  }

  searchQueryKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter')
      this.navigateTo(this.searchQuery);
  }

  navigateTo(query: string): void {
    if (query)
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          search_query: query
        },
        queryParamsHandling: 'merge'
      });
    else
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {}
      });
  }

  loadActivities(): void {
    this.loading = true; // Начало загрузки
    this.activitiesService.getActivities().subscribe(activities => {
      this.activities = activities;
      this.loadUserEnrollments();
    });
  }

  loadUserEnrollments(): void {
    if (!this.user?.id) {
      this.loading = false; // Завершение загрузки, если пользователь не авторизован
      return;
    }

    this.activitiesService.getUserActivities(this.user.id).pipe(
      catchError(err => {
        console.error('Ошибка при загрузке записей пользователя:', err);
        this.loading = false; // Завершение загрузки в случае ошибки
        return of([]);
      })
    ).subscribe(enrollments => {
      this.activities.forEach(activity => {
        activity.isEnrolled = enrollments.some(e => e.activityId === activity.id);
      });
      this.filterActivities();
      this.loading = false; // Завершение загрузки
    });
  }

  filterActivities(): void {
    this.pageIndex = 0; // Сброс индекса страницы
    this.paginatedActivities = this.filteredActivities.slice(0, this.pageSize);
    this.loading = false; // Завершение загрузки
  }

  // Обновление URL с новыми параметрами
  updateUrl(): void {
    const queryParams: any = {};

    if (this.searchQuery)
      queryParams.search_query = this.searchQuery;
    else
      queryParams.search_query = null;

    if (this.tags.length > 0)
      queryParams.tags = this.tags.join(',');
    else
      queryParams.tags = null;

    if (this.level)
      queryParams.level = this.level; // Добавляем параметр level
    else
      queryParams.level = null;

    // Обновляем URL с новыми параметрами
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge', // Объединяем с существующими параметрами
    });
  }

  // Разбор ввода пользователя на searchQuery и теги
  parseSearchInput(): void {
    const parts = this.searchInput.split('#');
    this.searchQuery = parts[0].trim();
    this.tags = parts.slice(1).map(tag => TagHelper.toUrlFormat(tag.trim()));
  }

  // Фильтрация активностей по searchQuery и тегам
  get filteredActivities(): Activity[] {
    return this.activities.filter(activity => {
      if ([Role.User, Role.Backup].includes(this.user?.role!) && activity.isClosed)
        return false;

      // Если searchQuery пустой, пропускаем фильтрацию по нему
      const matchesSearchQuery = this.searchQuery === '' || activity.title.toLowerCase().includes(this.searchQuery.toLowerCase());

      // Если тегов нет, пропускаем фильтрацию по ним
      const matchesTags = this.tags.length === 0 || this.tags.some(tag => {
        const normalizedTag = TagHelper.toDisplayFormat(tag); // Преобразуем тег из URL-формата в читаемый
        return activity.tags?.some(activityTag => activityTag.toLowerCase().includes(normalizedTag.toLowerCase()));
      });

      let matchesLevel = !this.level;
      switch (this.level?.toLowerCase()) {
        case 'легко':
          matchesLevel = activity.level === Level.Easy;
          break;
        case 'умеренно':
          matchesLevel = activity.level === Level.Medium;
          break;
        case 'сложно':
          matchesLevel = activity.level === Level.Hard;
          break;
      }

      return matchesSearchQuery && matchesTags && matchesLevel;
    });
  }

  // Подписка или отписка от курса
  toggleActivity(event: MouseEvent, activity: Activity): void {
    event.stopPropagation();
    if (!this.user || !this.user.id) return;

    this.loading = true; // Начало загрузки
    if (activity.isEnrolled) {
      this.unroll(this.user.id, activity.id);
    } else {
      this.enroll(this.user.id, activity.id);
    }
  }

  // Подписка на курс
  enroll(userId: string, activityId: string): void {
    this.activitiesService.createUserActivity({
      userId: userId,
      activityId: activityId
    }).pipe(
      catchError(err => {
        this.alertService.showSnackBar('Не удалось записаться на курс');
        console.error('Ошибка записи на курс:', err);
        this.loading = false; // Завершение загрузки в случае ошибки
        return of(undefined);
      })
    ).subscribe(response => {
      if (!response) return;
      this.activities = this.activities.map(activity => {
        if (activity.id === activityId)
          activity.isEnrolled = true;
        return activity;
      });
      this.filterActivities();
      this.alertService.showSnackBar('Вы успешно записались на курс');
      this.loading = false; // Завершение загрузки
    });
  }

  // Отписка от курса
  unroll(userId: string, activityId: string): void {
    this.activitiesService.deleteUserActivity(userId, activityId).pipe(
      catchError(err => {
        this.alertService.showSnackBar('Не удалось отписаться от курса');
        console.error('Ошибка отписки от курса:', err);
        this.loading = false; // Завершение загрузки в случае ошибки
        return of(undefined);
      })
    ).subscribe(_response => {
      this.activities = this.activities.map(activity => {
        if (activity.id === activityId)
          activity.isEnrolled = false;
        return activity;
      });
      this.filterActivities();
      this.alertService.showSnackBar('Вы успешно отписались от курса');
      this.loading = false; // Завершение загрузки
    });
  }

  onPageChange(event: any): void {
    this.loading = true; // Начало загрузки
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.paginatedActivities = this.filteredActivities.slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize);
    this.loading = false; // Завершение загрузки
  }

  editActivity(activity: Activity): void {
    this.router.navigate(['/activity/make', activity.id]);
  }

  openOrCloseActivity(activity: Activity): void {
    const dialogRef = activity.isClosed
      ? this.alertService.openConfirmDialog('Открытие активности', 'Вы уверены, что хотите открыть эту активность?')
      : this.alertService.openConfirmDialog('Закрытие активности', 'Вы уверены, что хотите закрыть эту активность?');

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      activity.isClosed = !activity.isClosed;
      this.activitiesService.updateActivity(activity.id, activity).subscribe(() => {

      });
    })
  }

  deleteActivity(activity: Activity): void {
    const dialogRef = this.alertService.openConfirmDialog('Удаление активности', 'Вы уверены, что хотите удалить эту активность?');
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.activitiesService.deleteActivity(activity.id).subscribe(() => {
        this.activities = this.activities.filter(a => a.id !== activity.id);
        this.alertService.showSnackBar('Активность успешно удалена!');
        this.filterActivities();
      });
    });
  }

  toDate(date?: string | number | Date): Date {
    return date ? new Date(date) : new Date();
  }
}
