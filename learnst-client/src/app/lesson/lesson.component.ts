import { LessonType } from '../../enums/LessonType';
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
import { AlertService } from '../../services/alert.service';
import { MatCardModule } from '@angular/material/card';

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
    MatProgressSpinnerModule,
  ]
})
export class LessonComponent extends MediumScreenSupport implements OnInit {
  loading = true;
  innerHTML = '';
  lesson?: Lesson;
  userId?: string;
  goBack!: () => void;

  LessonType = LessonType;

  constructor(
    public router: Router,
    public location: Location,
    private route: ActivatedRoute,
    private authService: AuthService,
    private alertService: AlertService,
    private lessonsService: LessonsService,
    private documentService: DocumentService
  ) {
    super();
  }

  ngOnInit() {
    this.loading = true; // Устанавливаем загрузку в начале

    this.authService.getUser().subscribe({
      next: user => {
        if (!user) {
          this.loading = false;
          return;
        }

        this.userId = user.id!;
        const lessonId = this.route.snapshot.paramMap.get('lessonId') ?? '';

        this.lessonsService.getLessonById(lessonId).subscribe({
          next: lesson => {
            this.lesson = lesson;
            if (!lesson) {
              this.loading = false;
              return;
            }

            this.checkAndCreateUserLesson(lessonId);

            if (this.lesson.longReadUrl) {
              this.loadMarkdownContent(this.lesson.longReadUrl);
            }

            if (this.lesson.videoUrl) {
              this.lesson.videoUrl = encodeURIComponent(this.lesson.videoUrl);
            }

            this.loading = false;
          },
          error: (err) => {
            console.error('Ошибка загрузки урока:', err);
            this.loading = false;
            this.alertService.showSnackBar('Не удалось загрузить урок');
          }
        });
      },
      error: (err) => {
        console.error('Ошибка получения пользователя:', err);
        this.loading = false;
      }
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
