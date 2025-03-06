import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NoDownloadingDirective } from '../../directives/NoDownloadingDirective';
import { PlaceholderImageDirective } from '../../directives/PlaceholderImageDirective';
import { InfoType } from '../../enums/InfoType';
import { Role } from '../../enums/Role';
import { LevelHelper } from '../../helpers/LevelHelper';
import { Return } from '../../helpers/Return';
import { Activity } from '../../models/Activity';
import { User } from '../../models/User';
import { RuDatePipe } from '../../pipes/ru.date.pipe';
import { ActivitiesService } from '../../services/activities.service';
import { AlertService } from '../../services/alert.service';
import { AnswersService } from '../../services/answers.service';
import { AuthService } from '../../services/auth.service';
import { CertificateService } from '../../services/certificate.service';
import { LessonsService } from '../../services/lessons.service';
import { TagHelper } from './../../helpers/TagHelper';
import { InfoCard } from './../../models/InfoCard';
import { MatMenuModule } from '@angular/material/menu';
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { EllipsisPipe } from '../../pipes/ellipsis.pipe';
import { InspectableDirective } from '../../pipes/inspectable.pipe';

interface ActivityNode {
  id: string;
  name: string;
  children?: ActivityNode[];
}

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
export class ActivityComponent implements OnInit {
  activeTab = 0;
  loading = true;
  totalPoints = 0;
  earnedPoints = 0;
  InfoType = InfoType;
  activity?: Activity;
  goBack!: () => void;
  totalLessonsCount = 0;
  user: User | null = null;
  benefits: InfoCard[] = [];
  completedLessonsCount = 0;
  waysToLearn: InfoCard[] = [];
  isCertificateLoading = false;
  isCertificateAvailable = false;
  dataSource: ActivityNode[] = [];

  LevelHelper = LevelHelper;

  // Метод для доступа к дочерним элементам узла
  childrenAccessor = (node: ActivityNode) => node.children ?? [];

  // Метод для проверки, есть ли у узла дети
  hasChild = (_: number, node: ActivityNode) => !!node.children && node.children.length > 0;

  constructor(
    public router: Router,
    public location: Location,
    private route: ActivatedRoute,
    private authService: AuthService,
    private alertService: AlertService,
    private answersService: AnswersService,
    private lessonsService: LessonsService,
    private activitiesService: ActivitiesService,
    private certificateService: CertificateService
  ) { }

  ngOnInit(): void {
    let activityId!: string;
    this.route.paramMap.subscribe(params =>
      activityId = params.get('activityId') ?? ''
    );

    this.route.queryParams.subscribe(queryParams =>
      this.activeTab = this.nameToIndex(queryParams['tab'])
    );

    this.authService.getUser().subscribe(user => {
      this.user = user;

      // Если пользователь не авторизован, перенаправляем назад
      if (!user) {
        this.goBack();
        return;
      }

      // Проверяем доступ к активности
      this.activitiesService.getActivityById(activityId).pipe(
        catchError(err => {
          this.handleError('Ошибка при загрузке данных активности', err);
          return of(undefined);
        })
      ).subscribe(activity => {
        if (!activity) {
          this.goBack();
          return;
        }

        // Проверяем условия для доступа
        const isUserEnrolled = this.activitiesService.isUserActivityExists(user.id!, activityId).pipe(
          catchError(() => of(false)) // В случае ошибки считаем, что пользователь не записан
        );

        isUserEnrolled.subscribe(exists => {
          if (
            // Обычный пользователь: должен быть записан на курс
            exists ||
            // Специалист: должен быть автором активности или записан на неё
            (user.role === Role.Specialist && ((activity as Activity).authorId === user.id)) ||
            // Администратор: всегда имеет доступ
            (user.role === Role.Admin)
          ) {
            this.loadActivityData(activityId, user.id!);
            return;
          }

          this.handleError('Чтобы перейти к курсу, вы должны записаться на него');
          this.goBack();
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
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  navigateToTag(tag: string) {
    this.router.navigate(['/activities'], {
      queryParams: { tags: TagHelper.toUrlFormat(tag) }
    })
  }

  getCertificate(): void {
    if (!this.isCertificateAvailable || !this.user || this.isCertificateLoading)
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
    this.isCertificateLoading = true;

    const userId = this.user.id!;
    const activityId = this.activity!.id;
    const emailAddress = this.user.emailAddress;

    // Вызываем API для отправки сертификата на почту
    this.certificateService.sendCertificateByEmail({
      userId, activityId, emailAddress
    }).pipe(
      catchError(error => {
        console.error('Произошла ошибка при отправке сертификата', error);
        this.alertService.showSnackBar('Произошла неожиданная ошибка. Попробуйте позже');
        this.isCertificateLoading = false;
        return of(null);
      })
    ).subscribe(response => {
      this.isCertificateLoading = false;
      if (!response) return;
      this.alertService.showSnackBar('Сертификат успешно отправлен вам на почту!');
    });
  }

  private loadActivityData(activityId: string, userId: string): void {
    this.activitiesService.getActivityById(activityId).pipe(
      catchError(err => {
        this.handleError('Ошибка при загрузке данных', err);
        return of(null);
      }),
      map(activity => {
        if (activity) {
          this.activity = activity;
          const { benefits, waysToLearn } = this.activity.infoCards.reduce<{
            benefits: InfoCard[],
            waysToLearn: InfoCard[]
          }>((accelerator, infoCard) => {
            if (infoCard.infoType === InfoType.Benefit)
              accelerator.benefits.push(infoCard);
            else if (infoCard.infoType === InfoType.WayToLearn)
              accelerator.waysToLearn.push(infoCard);
            return accelerator;
          }, { benefits: [], waysToLearn: [] });

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
          this.loading = false;
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
        this.handleError('Ошибка при загрузке пройденных уроков', err);
        return of([]);
      })
    ).subscribe(userLessons => {
      // Фильтруем уроки, которые относятся к текущей активности
      const completedLessons = userLessons.filter(ul => allLessons.some(lesson => lesson.id === ul.lessonId));
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
        this.isCertificateAvailable = allLessons.length > 0 && completedLessons.length === allLessons.length && hasEnoughPoints;
      });
    });
  }

  private loadLessonProgress(activityId: string, userId: string): void {
    // Получаем все уроки активности
    this.activitiesService.getActivityById(activityId).pipe(
      catchError(err => {
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
    this.loading = false;
    if (consoleError) console.error(err ?? message);
    this.alertService.showSnackBar(message);
  }

  private nameToIndex(name: string | null): number {
    if (name === 'plan') return 1;
    return 0;
  }

  private indexToName(index: number | null): string {
    if (index === 1) return 'plan';
    return 'info';
  }
}
