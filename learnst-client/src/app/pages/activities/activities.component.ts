import {CommonModule, Location} from '@angular/common';
import {Component, inject, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule, MatIconButton} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatMenuModule} from '@angular/material/menu';
import {MatPaginatorIntl, MatPaginatorModule} from '@angular/material/paginator';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {catchError, forkJoin, lastValueFrom, map, Observable, of} from 'rxjs';
import {NoDownloadingDirective} from '../../../angular/directives/no-downloading.directive';
import {PlaceholderImageDirective} from '../../../angular/directives/placeholder-image.directive';
import {Level} from '../../../data/enums/Level';
import {Role} from '../../../data/enums/Role';
import {MediumScreenSupport} from '../../../data/helpers/MediumScreenSupport';
import {Return} from '../../../data/helpers/Return';
import {TagHelper} from '../../../data/helpers/TagHelper';
import {getRussianPaginatorIntl} from '../../../angular/localization/RussianPaginatorIntl';
import {Activity} from '../../../data/models/Activity';
import {User} from '../../../data/models/User';
import {RuDatePipe} from '../../../angular/pipes/ru.date.pipe';
import {ActivitiesService} from '../../../data/services/activities.service';
import {AlertService} from '../../../data/services/alert.service';
import {AuthService} from '../../../data/services/auth.service';
import {LessonType} from '../../../data/enums/LessonType';
import {FileService} from '../../../data/services/file.service';
import {LogService} from '../../../data/services/log.service';

@Return()
@Component({
  selector: 'app-activities',
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.scss'],
  providers: [{provide: MatPaginatorIntl, useValue: getRussianPaginatorIntl()}],
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
  tags: string[] = [];
  pageSize = 6;
  pageIndex = 0;
  now = new Date();
  loading = true;
  searchInput = '';
  searchQuery = '';
  user: User | null = null;
  level: string | null = null;
  activities: Activity[] = [];
  paginatedActivities: Activity[] = [];
  pageSizeOptions = [6, 12, 24];
  protected readonly Role = Role;
  private logService = inject(LogService);
  private fileService = inject(FileService);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private activitiesService = inject(ActivitiesService);

  constructor(public location: Location, public router: Router) {
    super();
  }

  // Фильтрация активностей по searchQuery и тегам
  get filteredActivities(): Activity[] {
    return this.activities.filter(activity => {
      if ([Role.User, Role.Backup].includes(this.user?.role!) && activity.isClosed)
        return false;

      // Если searchQuery пустой, пропускаем фильтрацию по нему
      const matchesSearchQuery = this.searchQuery === ''
        || activity.title.toLowerCase().includes(this.searchQuery.toLowerCase());

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

    setInterval(() => this.now = new Date(), 60000);
  }

  // Обработка поиска
  onSearch(): void {
    this.parseSearchInput();
    this.updateUrl();
    this.filterActivities();
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
        this.logService.errorWithData('Ошибка при загрузке записей пользователя:', err);
        this.loading = false; // Завершение загрузки в случае ошибки
        return of([]);
      })
    ).subscribe(enrollments => {
      this.activities.forEach(activity =>
        activity.isEnrolled = enrollments.some(e => e.activityId === activity.id));
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

    queryParams.search_query = this.searchQuery ? this.searchQuery : null;
    queryParams.tags = this.tags.length > 0 ? this.tags.join(',') : null;
    queryParams.level = this.level || null; // Добавляем параметр level

    // Обновляем URL с новыми параметрами
    this.router.navigate([], {
      queryParams,
      relativeTo: this.route,
      queryParamsHandling: 'merge',
    });
  }

  // Разбор ввода пользователя на searchQuery и теги
  parseSearchInput(): void {
    const parts = this.searchInput.split('#');
    this.searchQuery = parts[0].trim();
    this.tags = parts.slice(1).map(tag => TagHelper.toUrlFormat(tag.trim()));
  }

  // Подписка или отписка от активности
  async toggleActivity(event: MouseEvent, activity: Activity): Promise<void> {
    event.stopPropagation();
    if (!this.user || !this.user.id)
      return;
    this.loading = true; // Начало загрузки
    if (activity.isEnrolled)
      await this.unroll(this.user.id, activity.id);
    else
      this.enroll(this.user.id, activity.id);
  }

  // Подписка на активность
  enroll(userId: string, activityId: string): void {
    this.activitiesService.createUserActivity({
      userId: userId,
      activityId: activityId
    }).pipe(
      catchError(err => {
        this.alertService.showSnackBar('Не удалось записаться на активность');
        this.logService.errorWithData('Ошибка записи на активность:', err);
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
      this.alertService.showSnackBar('Вы успешно записались на активность');
      this.loading = false; // Завершение загрузки
    });
  }

  // Отписка от курса
  async unroll(userId: string, activityId: string): Promise<void> {
    let confirmed = await lastValueFrom(this.alertService.openConfirmDialog(
      AlertService.CONFIRM_TITLE,
      'Вы уверены, что хотите отписаться от активности? Ваши результаты будут обнулены'
    ).afterClosed());

    if (!confirmed)
      return;

    this.activitiesService.deleteUserActivity(userId, activityId).pipe(
      catchError(err => {
        this.alertService.showSnackBar('Не удалось отписаться от активности');
        this.logService.errorWithData('Ошибка отписки от активности:', err);
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
      this.alertService.showSnackBar('Вы успешно отписались от активности');
      this.loading = false;
    });
  }

  onPageChange(event: any): void {
    this.loading = true;
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.paginatedActivities = this.filteredActivities.slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize);
    this.loading = false;
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
      this.activitiesService.updateActivity(activity.id, activity).subscribe();
    })
  }

  deleteActivity(activity: Activity): void {
    const dialogRef = this.alertService.openConfirmDialog('Удаление активности', 'Вы уверены, что хотите удалить эту активность?');
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      // Удаляем все файлы, связанные с активностью
      this.deleteActivityFiles(activity).subscribe({
        next: () =>
          // После успешного удаления файлов удаляем саму активность
          this.activitiesService.deleteActivity(activity.id).subscribe(() => {
            this.activities = this.activities.filter(a => a.id !== activity.id);
            this.alertService.showSnackBar('Активность успешно удалена!');
            this.filterActivities();
          }),
        error: (error) => {
          this.alertService.showSnackBar('Не удалось удалить файлы активности.');
          this.logService.errorWithData('Ошибка при удалении файлов:', error);
        }
      });
    });
  }

  toDate(date?: string | number | Date): Date {
    return date ? new Date(date) : new Date();
  }

  private deleteActivityFiles(activity: Activity): Observable<void> {
    const deleteObservables: Observable<void>[] = [];

    // Удаляем картинку активности
    if (activity.avatarUrl)
      deleteObservables.push(this.fileService.delete(activity.avatarUrl));

    // Удаляем картинки инфокарточек
    if (activity.infoCards)
      activity.infoCards.forEach(infoCard => {
        if (infoCard.iconUrl)
          deleteObservables.push(this.fileService.delete(infoCard.iconUrl));
      });

    // Удаляем файлы уроков
    if (activity.topics) {
      activity.topics.forEach(topic => {
        topic.lessons.forEach(lesson => {
          switch (lesson.lessonType) {
            case LessonType.LongRead:
              if (lesson.longReadUrl)
                deleteObservables.push(this.fileService.delete(lesson.longReadUrl));
              break;
            case LessonType.Video:
              if (lesson.videoUrl)
                deleteObservables.push(this.fileService.delete(lesson.videoUrl))
              break;
          }
        });
      });
    }

    // Если нет файлов для удаления, возвращаем успешный Observable
    if (deleteObservables.length === 0)
      return of();

    // Объединяем все запросы на удаление в один поток
    return forkJoin(deleteObservables).pipe(
      map(() => {
      }),
      catchError(error => {
        this.logService.errorWithData('Ошибка при удалении файлов:', error);
        throw error;
      })
    );
  }
}
