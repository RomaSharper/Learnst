import { LessonType } from './../../enums/LessonType';
import { Location } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { MediumScreenSupport } from '../../helpers/MediumScreenSupport';
import { Return } from '../../helpers/Return';
import { Lesson } from '../../models/Lesson';
import { UserLesson } from '../../models/UserLesson';
import { AuthService } from '../../services/auth.service';
import { DocumentService } from '../../services/document.service';
import { LessonsService } from '../../services/lessons.service';
import { QuestionsComponent } from '../questions/questions.component';
import { AlertService } from './../../services/alert.service';

@Return()
@Component({
  selector: 'app-lesson',
  templateUrl: './lesson.component.html',
  styleUrls: ['./lesson.component.scss'],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    MatButtonModule,
    QuestionsComponent,
    MatProgressSpinnerModule,
  ]
})
export class LessonComponent extends MediumScreenSupport implements OnInit {
[x: string]: any;
  loading = true;
  innerHTML = '';
  lesson?: Lesson;
  userId?: string;
  goBack!: () => void;

  LessonType = LessonType;

  constructor(
    private lessonsService: LessonsService,
    private documentService: DocumentService,
    private route: ActivatedRoute,
    private alertService: AlertService,
    private authService: AuthService,
    public location: Location,
    public router: Router
  ) {
    super();
  }

  ngOnInit() {
    // Получаем ID пользователя
    this.authService.getUser().subscribe(user => {
      if (!user) return;
      this.userId = user.id!;
      const lessonId = this.route.snapshot.paramMap.get('lessonId') ?? ''; // Загружаем урок
      this.lessonsService.getLessonById(lessonId).subscribe(lesson => {
        if (!lesson) return;
        this.lesson = lesson;
        // Проверяем, был ли урок уже пройден
        this.checkAndCreateUserLesson(lessonId);
        if (this.lesson.longReadUrl)
          this.loadMarkdownContent(this.lesson.longReadUrl);
        if (this.lesson.videoUrl)
          this.lesson.videoUrl = encodeURIComponent(this.lesson.videoUrl);
        this.loading = false;
      });
    });
  }

  // Метод для проверки и создания записи в UserLessons
  private checkAndCreateUserLesson(lessonId: string): void {
    if (!this.userId) return;
    this.lessonsService.getUserLesson(this.userId, lessonId).subscribe({
      next: (userLesson) => {
        if (!userLesson) {
          const newUserLesson: UserLesson = {
            userId: this.userId!,
            lessonId: lessonId
          };
          this.lessonsService.createUserLesson(newUserLesson).subscribe({
            next: () => {
              console.log('Запись в UserLessons создана');
            },
            error: (err) => {
              console.error('Ошибка при создании записи в UserLessons:', err);
            }
          });
        }
      },
      error: (err) => {
        console.error('Ошибка при проверке UserLessons:', err);
      }
    });
  }

  // Метод для загрузки и отображения Markdown
  private loadMarkdownContent(url: string): void {
    this.documentService.getMarkdown(url).subscribe({
      next: markdown => {
        const htmlContent = this.documentService.markdownToHtml(markdown);
        this.innerHTML = htmlContent.toString();
      }, error: err => {
        console.error('Ошибка загрузки Markdown:', err);
        this.alertService.showSnackBar('Произошла ошибка при загрузке документа');
      },
    });
  }
}
