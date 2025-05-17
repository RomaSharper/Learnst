import {LessonType} from '../../enums/LessonType';
import {Location} from '@angular/common';
import {Component, CUSTOM_ELEMENTS_SCHEMA, inject, NO_ERRORS_SCHEMA, OnInit, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {ActivatedRoute, Router} from '@angular/router';
import {MediumScreenSupport} from '../../helpers/MediumScreenSupport';
import {Return} from '../../helpers/Return';
import {Lesson} from '../../models/Lesson';
import {AuthService} from '../../services/auth.service';
import {DocumentService} from '../../services/document.service';
import {LessonsService} from '../../services/lessons.service';
import {QuestionsComponent} from '../questions/questions.component';
import {AlertService} from '../../services/alert.service';
import {MatCardModule} from '@angular/material/card';
import {NoDownloadingDirective} from '../../directives/no-downloading.directive';
import {LogService} from '../../services/log.service';

@Return()
@Component({
  selector: 'app-lesson',
  templateUrl: './lesson.component.html',
  styleUrls: ['./lesson.component.scss'],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    MatCardModule,
    MatButtonModule,
    QuestionsComponent,
    NoDownloadingDirective,
    MatProgressSpinnerModule
  ]
})
export class LessonComponent extends MediumScreenSupport implements OnInit {
  private logService = inject(LogService);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private lessonsService = inject(LessonsService);
  private documentService = inject(DocumentService);

  lesson?: Lesson;
  userId?: string;
  goBack!: () => void;
  innerHTML = '';
  LessonType = LessonType;
  loading = signal(true);

  constructor(protected router: Router, protected location: Location) {
    super();
  }

  ngOnInit() {
    this.authService.getUser().subscribe({
      next: user => {
        if (!user) {
          this.loading.set(false);
          return;
        }

        this.userId = user.id!;
        this.loadLesson(this.getLessonId());
      },
      error: err => this.handleError('Ошибка получения пользователя:', err)
    });
  }

  private getLessonId(): string {
    return this.route.snapshot.paramMap.get('lessonId') ?? '';
  }

  private loadLesson(lessonId: string) {
    this.lessonsService.getLessonById(lessonId).subscribe({
      next: lesson => {
        this.lesson = lesson;
        if (!lesson) {
          this.loading.set(false);
          return;
        }

        this.checkAndCreateUserLesson(lessonId);
        this.loadContent();
      },
      error: err => this.handleError('Ошибка загрузки урока:', err)
    });
  }

  private loadContent() {
    if (this.lesson?.longReadUrl)
      this.loadMarkdownContent(this.lesson.longReadUrl);
    if (this.lesson?.videoUrl)
      this.lesson.videoUrl = encodeURIComponent(this.lesson.videoUrl);
    if (this.loading())
      this.loading.set(false);
  }

  private handleError(message: string, error: any) {
    this.logService.errorWithData(message, error);
    this.loading.set(false);
    this.alertService.showSnackBar('Не удалось загрузить урок');
  }

  private checkAndCreateUserLesson(lessonId: string): void {
    if (!this.userId) return;

    this.lessonsService.getUserLesson(this.userId, lessonId).subscribe({
      next: (userLesson) => {
        if (!userLesson)
          this.createUserLesson(lessonId);
      },
      error: err => this.logService.errorWithData('Ошибка при проверке UserLessons:', err)
    });
  }

  private createUserLesson(lessonId: string): void {
    this.lessonsService.createUserLesson({
      userId: this.userId!,
      lessonId: lessonId
    }).subscribe({
      error: err => this.logService.errorWithData('Ошибка при создании записи в UserLessons:', err)
    });
  }

  private loadMarkdownContent(url: string): void {
    this.documentService.getMarkdown(url).subscribe({
      next: markdown => {
        this.innerHTML = this.documentService.markdownToHtml(markdown).toString();
        this.loading.set(false);
      },
      error: err => {
        this.logService.errorWithData('Ошибка загрузки Markdown:', err);
        this.alertService.showSnackBar('Произошла ошибка при загрузке документа');
        this.loading.set(false);
      }
    });
  }
}
