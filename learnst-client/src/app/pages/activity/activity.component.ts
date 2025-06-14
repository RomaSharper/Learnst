import {Location} from '@angular/common';
import {Component, inject, OnInit, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatChipsModule} from '@angular/material/chips';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatMenuModule} from '@angular/material/menu';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTabsModule} from '@angular/material/tabs';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatTreeModule} from '@angular/material/tree';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {InspectableDirective} from '../../../angular/directives/inspectable.directive';
import {NoDownloadingDirective} from '../../../angular/directives/no-downloading.directive';
import {PlaceholderImageDirective} from '../../../angular/directives/placeholder-image.directive';
import {InfoType} from '../../../data/enums/InfoType';
import {Role} from '../../../data/enums/Role';
import {LevelHelper} from '../../../data/helpers/LevelHelper';
import {Return} from '../../../data/helpers/Return';
import {Activity} from '../../../data/models/Activity';
import {User} from '../../../data/models/User';
import {EllipsisPipe} from '../../../angular/pipes/ellipsis.pipe';
import {RuDatePipe} from '../../../angular/pipes/ru.date.pipe';
import {ActivitiesService} from '../../../data/services/activities.service';
import {AlertService} from '../../../data/services/alert.service';
import {AnswersService} from '../../../data/services/answers.service';
import {AuthService} from '../../../data/services/auth.service';
import {CertificateService} from '../../../data/services/certificate.service';
import {LessonsService} from '../../../data/services/lessons.service';
import {UserMenuComponent} from '../../widgets/user-menu/user-menu.component';
import {TagHelper} from '../../../data/helpers/TagHelper';
import {InfoCard} from '../../../data/models/InfoCard';
import {AudioService} from '../../../data/services/audio.service';
import {ActivityNode} from '../../../data/models/ActivityNode';
import {MediumScreenSupport} from '../../../data/helpers/MediumScreenSupport';
import {LogService} from '../../../data/services/log.service';

@Return()
@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss'],
  imports: [
    RuDatePipe,
    RouterLink,
    EllipsisPipe,
    MatTabsModule,
    MatIconModule,
    MatCardModule,
    MatTreeModule,
    MatListModule,
    MatMenuModule,
    MatChipsModule,
    MatButtonModule,
    MatTooltipModule,
    UserMenuComponent,
    InspectableDirective,
    MatProgressBarModule,
    NoDownloadingDirective,
    MatProgressSpinnerModule,
    PlaceholderImageDirective
  ]
})
export class ActivityComponent extends MediumScreenSupport implements OnInit {
  activity?: Activity;
  goBack!: () => void;
  activeTab = 0;
  totalPoints = 0;
  earnedPoints = 0;
  user: User | null = null;
  benefits: InfoCard[] = [];
  waysToLearn: InfoCard[] = [];
  totalLessonsCount = 0;
  dataSource: ActivityNode[] = [];
  completedLessonsCount = 0;
  loading = signal(true);
  isCertificateLoading = signal(false);
  isCertificateAvailable = signal(false);
  protected readonly LevelHelper = LevelHelper;
  private logService = inject(LogService);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private audioService = inject(AudioService);
  private answersService = inject(AnswersService);
  private lessonsService = inject(LessonsService);
  private activitiesService = inject(ActivitiesService);
  private certificateService = inject(CertificateService);

  constructor(public router: Router, public location: Location) {
    super();
  }

  // Метод для доступа к дочерним элементам узла
  childrenAccessor =
    (node: ActivityNode) => node.children ?? [];

  // Метод для проверки, есть ли у узла дети
  hasChild =
    (_: number, node: ActivityNode) => !!node.children && node.children.length > 0;

  ngOnInit(): void {
    let activityId = '';
    this.route.paramMap.subscribe(params => activityId = params.get('activityId') ?? '');
    this.route.queryParams.subscribe(queryParams => this.activeTab = this.nameToIndex(queryParams['tab']));

    this.authService.getUser().subscribe(user => {
      this.user = user;

      // Если пользователь не авторизован, перенаправляем назад
      if (!user) {
        this.router.navigate(['/']);
        return;
      }

      this.activitiesService.getActivityById(activityId).pipe( // Проверяем доступ к активности
        catchError(err => {
          this.loading.set(false);
          this.handleError('Ошибка при загрузке данных активности', err);
          return of(undefined);
        })
      ).subscribe(activity => {
        if (!activity || !user.id) {
          this.router.navigate(['/activities']);
          return;
        }

        // Проверяем условия для доступа

        this.activitiesService.isUserActivityExists(user.id, activityId).pipe(
          catchError(() => of(false)) // В случае ошибки считаем, что пользователь не записан
        ).subscribe(exists => {
          if (exists // Обычный пользователь: должен быть записан на активность
            || user.role === Role.Admin // Администратор: всегда имеет доступ
            || user.role === Role.Specialist && ((activity as Activity).authorId === user.id) // Специалист: если автор активности
          ) {
            this.loadActivityData(activityId, user.id!);
            return;
          }

          this.handleError('Чтобы перейти к активности, вы должны записаться на нее');
          this.router.navigate(['/activities']);
        });
      });
    });
  }

  onTabChange(index: number): void {
    this.activeTab = index;
    this.updateUrl();
  }

  updateUrl(): void {
    const tab = this.indexToName(this.activeTab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {tab},
      queryParamsHandling: 'merge'
    });
  }

  navigateToTag(tag: string): void {
    this.router.navigate(['/activities'], {
      queryParams: {tags: TagHelper.toUrlFormat(tag)}
    })
  }

  getCertificate(): void {
    if (!this.isCertificateAvailable() || !this.user || this.isCertificateLoading())
      return;

    if (!this.user.fullName) {
      this.alertService.showSnackBar('Пожалуйста, заполните ваше полное имя в вашем аккаунте.');
      return;
    }

    if (!this.user.emailAddress) {
      this.alertService.showSnackBar('Пожалуйста, заполните электронную почту в вашем аккаунте.');
      return;
    }

    // Включаем состояние загрузки
    this.isCertificateLoading.set(true);

    const userId = this.user.id!;
    const activityId = this.activity!.id;
    const emailAddress = this.user.emailAddress;

    // Вызываем API для отправки сертификата на почту
    this.certificateService.sendCertificateByEmail({
      userId, activityId, emailAddress
    }).pipe(
      catchError(error => {
        this.logService.errorWithData('Произошла ошибка при отправке сертификата', error);
        this.alertService.showSnackBar('Произошла неожиданная ошибка. Попробуйте позже');
        this.isCertificateLoading.set(false);
        return of(null);
      })
    ).subscribe(response => {
      this.isCertificateLoading.set(false);
      if (!response) return;
      this.audioService.playVictorySound();
      this.alertService.showSnackBar('Сертификат успешно отправлен вам на почту!');
    });
  }

  private loadActivityData(activityId: string, userId: string): void {
    this.activitiesService.getActivityById(activityId).pipe(
      catchError(err => {
        this.loading.set(false);
        this.handleError('Ошибка при загрузке данных', err);
        return of(null);
      }),
      map(activity => {
        if (activity) {
          this.activity = activity;
          const {benefits, waysToLearn} = this.activity.infoCards.reduce<{
            benefits: InfoCard[],
            waysToLearn: InfoCard[]
          }>((accelerator, infoCard) => {
            if (infoCard.infoType === InfoType.Benefit)
              accelerator.benefits.push(infoCard);
            else if (infoCard.infoType === InfoType.WayToLearn)
              accelerator.waysToLearn.push(infoCard);
            return accelerator;
          }, {benefits: [], waysToLearn: []});

          this.benefits = benefits;
          this.waysToLearn = waysToLearn;

          // Преобразуем темы и уроки в узлы дерева
          this.dataSource = this.activity.topics.map(topic => ({
            name: topic.title,
            id: topic.id!,
            children: topic.lessons.map(lesson => ({
              name: lesson.title,
              id: lesson.id,
            })),
          }));

          // Загружаем прогресс по урокам и баллам
          this.loadLessonProgress(activityId, userId);
          this.loadPointsProgress(activityId, userId);

          // Проверяем доступность сертификата
          this.checkCertificateAvailability(userId);
          this.loading.set(false);
        }
        return activity;
      })
    ).subscribe();
  }

  private checkCertificateAvailability(userId: string): void {
    if (!this.activity) return;

    // Получаем все уроки активности
    const allLessons = this.activity.topics.flatMap(topic => topic.lessons);
    this.totalLessonsCount = allLessons.length;

    // Получаем пройденные уроки
    this.lessonsService.getUserLessonsByUserId(userId).pipe(
      catchError(err => {
        this.loading.set(false);
        this.handleError('Ошибка при загрузке пройденных уроков', err);
        return of([]);
      })
    ).subscribe(userLessons => {
      const completedLessons = userLessons.filter(
        ul => allLessons.some(lesson => lesson.id === ul.lessonId)); // Фильтруем уроки, которые относятся к текущей активности
      this.completedLessonsCount = completedLessons.length;

      // Получаем количество набранных баллов
      this.answersService.getCorrectAnswersCountByActivity(this.activity!.id, userId).pipe(
        catchError(err => {
          this.handleError('Ошибка при загрузке баллов', err);
          return of(0);
        })
      ).subscribe(points => {
        this.earnedPoints = points;

        // Проверяем, набрал ли пользователь минимальное количество баллов
        const hasEnoughPoints = this.activity!.minimalScore ? points >= this.activity!.minimalScore : true;

        // Сертификат доступен, если пройдены все уроки и набраны баллы
        this.isCertificateAvailable.set(
          allLessons.length > 0 && completedLessons.length === allLessons.length && hasEnoughPoints);
      });
    });
  }

  private loadLessonProgress(activityId: string, userId: string): void {
    // Получаем все уроки активности
    this.activitiesService.getActivityById(activityId).pipe(
      catchError(err => {
        this.loading.set(false);
        this.handleError('Ошибка при загрузке уроков', err);
        return of(null);
      })
    ).subscribe(activity => {
      if (!activity) return;

      // Собираем все уроки из всех тем
      const allLessons = this.activity!.topics.flatMap(topic => topic.lessons);
      this.totalLessonsCount = allLessons.length;

      // Получаем пройденные уроки
      this.lessonsService.getUserLessonsByUserId(userId).pipe(
        catchError(err => {
          this.loading.set(false);
          this.handleError('Ошибка при загрузке пройденных уроков', err);
          return of([]);
        })
      ).subscribe(userLessons => {
        // Фильтруем уроки, которые относятся к текущей активности
        const completedLessons = userLessons.filter(ul =>
          allLessons.some(lesson => lesson.id === ul.lessonId)
        );
        this.completedLessonsCount = completedLessons.length;
      });
    });
  }

  private loadPointsProgress(activityId: string, userId: string): void {
    // Получаем количество набранных баллов
    this.answersService.getCorrectAnswersCountByActivity(activityId, userId).pipe(
      catchError(err => {
        this.handleError('Ошибка при загрузке баллов', err);
        return of(0);
      })
    ).subscribe(points => {
      this.earnedPoints = points;
    });

    // Получаем общее количество баллов
    this.answersService.getTotalQuestionsCountByActivity(activityId).pipe(
      catchError(err => {
        this.handleError('Ошибка при загрузке общего количества вопросов', err);
        return of(0);
      })
    ).subscribe(total => {
      this.totalPoints = total;
    });
  }

  private handleError(message: string, err: Error | null = null, consoleError: boolean = true): void {
    this.loading.set(false);
    if (consoleError)
      this.logService.errorWithData(err?.message || message);
    this.alertService.showSnackBar(message);
  }

  private nameToIndex(name: string | null): number {
    return name === 'plan' ? 1 : 0;
  }

  private indexToName(index: number | null): string {
    return index === 1 ? 'plan' : 'info';
  }

  protected readonly Role = Role;
}
