import { ENTER } from '@angular/cdk/keycodes';
import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { NoDownloadingDirective } from '../../directives/NoDownloadingDirective';
import { AnswerType } from '../../enums/AnswerType';
import { InfoType } from '../../enums/InfoType';
import { LessonType } from '../../enums/LessonType';
import { Level } from '../../enums/Level';
import { InfoTypeHelper } from '../../helpers/InfoTypeHelper';
import { LevelHelper } from '../../helpers/LevelHelper';
import { MediumScreenSupport } from '../../helpers/MediumScreenSupport';
import { Return } from '../../helpers/Return';
import { Activity } from '../../models/Activity';
import { InfoCard } from '../../models/InfoCard';
import { Topic } from '../../models/Topic';
import { ActivitiesService } from '../../services/activities.service';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { DateService } from '../../services/date.service';
import { FileService } from '../../services/file.service';
import { ValidationService } from '../../services/validation.service';
import { InfoCardDialogComponent } from './info.card.dialog/info.card.dialog.component';
import { TopicDialogComponent } from './topic.dialog/topic.dialog.component';

@Return()
@Component({
  selector: 'app-make-activity',
  templateUrl: './make-activity.component.html',
  styleUrls: ['./make-activity.component.less'],
  imports: [
    RouterLink,
    FormsModule,
    CommonModule,
    MatMenuModule,
    MatIconModule,
    MatCardModule,
    MatInputModule,
    MatChipsModule,
    MatSelectModule,
    MatButtonModule,
    MatTooltipModule,
    MatGridListModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatSlideToggleModule,
    MatAutocompleteModule,
    NoDownloadingDirective,
    MatProgressSpinnerModule
  ]
})
export class MakeActivityComponent extends MediumScreenSupport implements OnInit {
  userId?: string;
  tags: string[] = [];
  activityId?: string;
  selectedFile?: File;
  topics: Topic[] = [];
  oldAvatarUrl?: string;
  activityForm: FormGroup;
  checkList: string[] = [];
  previewAvatarUrl?: string;
  infoCards: InfoCard[] = [];
  filteredTags: string[] = [];
  targetAudience: string[] = [];
  levels = LevelHelper.getLevels();
  separatorKeysCodes: number[] = [ENTER]; // Клавиши для добавления чипсов
  allTags = [
    // Популярные языки программирования
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'C', 'Ruby', 'Go', 'Rust',
    'Swift', 'Kotlin', 'PHP', 'Perl', 'R', 'Dart', 'Scala', 'Groovy', 'Lua', '1С',
    'Objective-C', 'Shell', 'Bash', 'PowerShell', 'F#', 'AutoIt3', 'Pascal', 'Delphi',
    'Assembler',

    // Фреймворки и библиотеки
    'Angular', 'React', 'Vue', 'Svelte', 'Next.js', 'Nuxt.js', 'Express', 'NestJS', 'Django', 'SQLAlchemy', 'Dapper',
    'Flask', 'FastAPI', 'Spring', 'Laravel', 'Symfony', 'Ruby on Rails', 'Qt', 'GTK', 'WPF', 'WinForms', 'Unity',
    'ASP.NET', 'ASP.NET Core', 'Blazor', 'Xamarin', 'Flutter', 'React Native', 'Ionic', 'Electron', 'JPA',
    'Unreal Engine', 'Godot', 'TensorFlow', 'PyTorch', 'NumPy', 'Node.js', 'Entity Framework', 'Hibernate',

    // Паттерны проектирования
    'Одиночка', 'Фабрика', 'Абстрактная фабрика', 'Строитель', 'Прототип', 'Адаптер', 'Мост',
    'Компоновщик', 'Декоратор', 'Фасад', 'Приспособленец', 'Заместитель', 'Цепочка обязанностей',
    'Команда', 'Итератор', 'Посредник', 'Хранитель', 'Наблюдатель', 'Состояние', 'Стратегия', 'Шаблонный метод',
    'Посетитель', 'Внедрение зависимостей', 'Инверсия управления', 'Шаблон репозитория', 'Единица работы',
    'CQRS', 'Event Sourcing', 'Предметно-ориентированное проектирование', 'Микросервисы', 'Монолит', 'Бессерверная архитектура',
    'Событийно-ориентированная архитектура', 'Многослойная архитектура', 'Шестиугольная архитектура', 'Чистая архитектура',
    'Архитектура "Луковица"', 'MVC', 'MVVM', 'MVP',

    // Принципы программирования
    'SOLID', 'DRY', 'KISS', 'YAGNI', 'GRASP', 'Принцип единственной ответственности', 'Принцип открытости/закрытости',
    'Принцип подстановки Барбары Лисков', 'Закон Деметры', 'Разделение ответственности',
    'Принцип разделения интерфейса', 'Принцип инверсии зависимостей', 'Композиция вместо наследования',
    'Конвенция вместо конфигурации',

    // Классификация языков
    'ООП', 'Функциональное программирование', 'Императивное программирование', 'Декларативное программирование',
    'Процедурное программирование', 'Логическое программирование', 'Реактивное программирование',
    'Асинхронное программирование', 'Параллельное программирование', 'Многопоточное программирование',
    'Событийное программирование', 'Метапрограммирование', 'Генеративное программирование',
    'Аспектное программирование', 'Компонентное программирование',

    // Базы данных
    'SQL', 'NoSQL', 'MySQL', 'PostgreSQL', 'SQLite', 'MariaDB', 'Oracle', 'Microsoft SQL Server',
    'MongoDB', 'Redis', 'Elasticsearch', 'Firebase',

    // DevOps и инструменты
    'Docker', 'Kubernetes', 'GitLab', 'GitHub', 'Prometheus', 'Grafana', 'ELK Stack', 'Consul', 'Nginx', 'Apache',

    // Направления в разработке
    'Фронтенд', 'Бекэнд', 'Фулстек', 'UI/UX', 'Геймдев', 'Моделирование', 'Дизайн',

    // Веб-технологии
    'HTML', 'CSS', 'LESS', 'SASS', 'SCSS', 'Bootstrap', 'Tailwind CSS', 'Material UI', 'Webpack', 'Vite',
    'Parcel', 'Babel', 'ESLint', 'GraphQL', 'REST', 'gRPC', 'WebSocket', 'OAuth', 'JWT', 'CORS', 'CSRF',
    'XSS', 'SQL Инъекции', 'HTTP', 'HTTPS', 'SSL', 'TLS', 'CDN', 'Service Worker', 'PWA', 'WebAssembly', 'Shadow DOM',

    // Операционные системы
    'Linux', 'Windows', 'macOS', 'iOS', 'Android', 'Ubuntu', 'Debian', 'Fedora', 'Arch Linux',
    'Red Hat', 'FreeBSD', 'Chrome OS', 'Tizen',

    // Другие технологии и концепции
    'Blockchain', 'Web3', 'NFT', 'TCP IP', 'Big Data', 'Машинное обучение', 'Data Science', 'AR', 'VR',
    'Bluetooth', 'GPS', 'NFC', 'Аналитика', 'Геометрия', 'Алгебра', 'Биометрия', 'Кибербезопасность',
    'Фаервол', 'VPN', 'Цифровые подписи', 'Wi-Fi', 'Roblox'
  ];

  InfoType = InfoType;
  InfoTypeHelper = InfoTypeHelper;

  constructor(
    private fb: FormBuilder,
    private activitiesService: ActivitiesService,
    private authService: AuthService,
    private fileService: FileService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    public location: Location,
    public router: Router
  ) {
    super();
    this.activityForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      avatarUrl: [''],
      level: [Level.Easy, Validators.required],
      isClosed: [false],
      endAt: [''],
      minimalScore: [0, [Validators.min(0), this.maxScoreValidator.bind(this)]]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const activityId = params['activityId'];
      if (!activityId) return;
      this.activityId = activityId;
      this.loadActivity(activityId);
    });

    this.authService.getUser().subscribe(user =>
      this.userId = user?.id
    );
  }

  loadActivity(activityId: string): void {
    this.activitiesService.getActivityById(activityId).pipe(
      catchError(err => {
        this.handleError('Не удалось загрузить активность', err);
        this.router.navigate(['/activities']);
        return of(null);
      })
    ).subscribe((activity: Activity | null) => {
      if (!activity) return;

      this.activityForm.patchValue({
        ...activity,
        minimalScore: activity.minimalScore || 0,
        endAt: activity.endAt ? new Date(activity.endAt) : null
      });
      this.previewAvatarUrl = activity.avatarUrl;
      this.oldAvatarUrl = activity.avatarUrl;
      this.tags = activity.tags || [];
      this.targetAudience = activity.targetAudience || [];
      this.checkList = activity.checkList || [];
      this.infoCards = activity.infoCards || [];
      this.topics = activity.topics || [];
    });
  }

  openFilePicker(): void {
    const fileInput = document.getElementById('avatarInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewAvatarUrl = e.target!.result as string; // Временное отображение нового аватара
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  // Методы для работы с тэгами
  addTagFromInput(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value)
      this.addTag(value);
    event.chipInput!.clear();
    this.clearInput();
  }

  addTagFromAutocomplete(event: MatAutocompleteSelectedEvent): void {
    this.addTag(event.option.viewValue);
    event.option.deselect();
    this.clearInput();
  }

  filterTags(value: string): void {
    this.filteredTags = this.allTags.filter(tag =>
      tag.toLowerCase().includes(value.toLowerCase())
    );
  }

  addTag(tag: string): void {
    if (tag && !this.tags.includes(tag))
      this.tags.push(tag);
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
  }

  // Методы для работы с целевой аудиторией
  addAudience(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.targetAudience.includes(value))
      this.targetAudience.push(value);
    event.chipInput!.clear(); // Очищаем поле ввода
  }

  removeAudience(audience: string): void {
    this.targetAudience = this.targetAudience.filter(a => a !== audience);
  }

  // Методы для работы с чек-листом
  addChecklistItem(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.checkList.includes(value))
      this.checkList.push(value);
    event.chipInput!.clear(); // Очищаем поле ввода
  }

  removeChecklistItem(item: string): void {
    this.checkList = this.checkList.filter(i => i !== item);
  }

  // Метод для добавления инфокарты
  addInfoCard(): void {
    const dialogRef = this.alertService.getDialog().open(InfoCardDialogComponent, {
      width: '500px',
      data: { infoCard: null } // Передаём null для создания новой карточки
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result)
        this.infoCards.push(result);
    });
  }

  // Метод для редактирования инфокарты
  editInfoCard(index: number): void {
    const dialogRef = this.alertService.getDialog().open(InfoCardDialogComponent, {
      width: '500px',
      data: { infoCard: this.infoCards[index] } // Передаём текущую карточку для редактирования
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.infoCards[index] = result;
      }
    });
  }

  // Метод для удаления инфокарты
  removeInfoCard(index: number): void {
    this.infoCards.splice(index, 1);
  }

  // Метод для добавления темы
  addTopic(): void {
    const dialogRef = this.alertService.getDialog().open(TopicDialogComponent, {
      width: '500px',
      data: { topic: null } // Передаём null для создания новой темы
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.topics.push({
        ...result,
        id: ValidationService.emptyGuid,
        lessons: result.lessons || [],
        activityId: this.activityId || ''
      });
      this.activityForm.get('minimalScore')?.updateValueAndValidity(); // Обновляем валидацию
    });
  }

  // Метод для редактирования темы
  editTopic(index: number): void {
    const dialogRef = this.alertService.getDialog().open(TopicDialogComponent, {
      width: '500px',
      data: { topic: this.topics[index] } // Передаём текущую тему для редактирования
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.topics[index].title = result.title;
      this.topics[index].lessons = result.lessons;
      this.activityForm.get('minimalScore')?.updateValueAndValidity(); // Обновляем валидацию
    });
  }

  // Метод для удаления темы
  removeTopic(index: number): void {
    const topic = this.topics[index];
    this.alertService.openConfirmDialog(
      'Удаление темы',
      `Вы уверены, что хотите удалить тему "${topic.title}"?`
    ).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.topics.splice(index, 1); // Удаляем тему, если пользователь подтвердил
      this.activityForm.get('minimalScore')?.updateValueAndValidity(); // Обновляем валидацию
      this.activityForm.updateValueAndValidity(); // Перепроверяем валидность всей формы
    });
  }

  getTotalQuestionsCount(): number {
    return this.topics.reduce((total, topic) => {
      return total + topic.lessons.reduce((lessonTotal, lesson) => {
        return lessonTotal + (lesson.questions?.length || 0);
      }, 0);
    }, 0);
  }

  onSubmit(): void {
    if (this.activityForm.invalid) {
      this.handleError('Пожалуйста, заполните все поля корректно');
      return;
    }

    if (
      !this.validateTopics() ||
      !this.validateLessons() ||
      !this.validateQuestions() ||
      !this.validateAnswers()
    ) {
      return;
    }

    if (this.selectedFile)
      this.uploadFileAndSaveActivity();
    else
      this.saveActivity();
  }

  private maxScoreValidator(control: AbstractControl): ValidationErrors | null {
    const totalQuestions = this.getTotalQuestionsCount();
    if (control.value > totalQuestions)
      return { maxScore: { max: totalQuestions, actual: control.value } };
    return null;
  }

  private validateTopics(): boolean {
    if (this.topics.length > 30) {
      this.alertService.showSnackBar(`Количество тем не должно превышать 30 (Текущее кол-во: ${this.topics.length}).`);
      return false;
    }

    for (const topic of this.topics) {
      if (!topic.lessons || topic.lessons.length === 0) {
        this.alertService.showSnackBar(`Тема "${topic.title}" должна содержать минимум один урок.`);
        return false;
      } else if (topic.lessons.length > 30) {
        this.alertService.showSnackBar(`Количество уроков в теме "${topic.title}" не должно превышать 30 (Текущее кол-во: ${topic.lessons.length}).`);
        return false;
      }
    }
    return true;
  }

  private validateLessons(): boolean {
    for (const topic of this.topics) {
      for (const lesson of topic.lessons) {
        if (lesson.lessonType === LessonType.Test && (!lesson.questions || lesson.questions.length === 0)) {
          this.alertService.showSnackBar(`Урок "${lesson.title}" из темы "${topic.title}" должен содержать минимум один вопрос.`);
          return false;
        }
      }
    }
    return true;
  }

  private validateQuestions(): boolean {
    for (const topic of this.topics) {
      for (const lesson of topic.lessons) {
        if (lesson.lessonType === LessonType.Test) {
          for (const question of lesson.questions) {
            if (!question.answers || question.answers.length < 2) {
              this.alertService.showSnackBar(`Вопрос "${question.text}" должен содержать минимум два ответа.`);
              return false;
            } else if (question.answers.length > 5) {
              this.alertService.showSnackBar(`Количество ответов на вопрос "${question.text}" в уроке "${lesson.title}" по теме "${topic.title}" не должно превышать 5 (Текущее кол-во: ${question.answers.length}).`);
              return false;
            }
          }
        }
      }
    }
    return true;
  }

  private validateAnswers(): boolean {
    for (const topic of this.topics) {
      for (const lesson of topic.lessons) {
        if (lesson.lessonType === LessonType.Test) {
          for (const question of lesson.questions) {
            const correctAnswersCount = question.answers.filter(answer => answer.isCorrect).length;

            if (question.answerType === AnswerType.Single && correctAnswersCount !== 1) {
              this.alertService.showSnackBar(`Вопрос "${question.text}" (одиночный выбор) должен содержать ровно один правильный ответ.`);
              return false;
            }

            if (question.answerType === AnswerType.Multiple && correctAnswersCount < 2) {
              this.alertService.showSnackBar(`Вопрос "${question.text}" (множественный выбор) должен содержать минимум два правильных ответа.`);
              return false;
            }
          }
        }
      }
    }
    return true;
  }

  private clearInput(): void {
    const inputElement = document.querySelector('input[name="currentTag"]') as HTMLInputElement;
    if (inputElement)
      inputElement.value = '';
    this.filterTags('');
  }

  private uploadFileAndSaveActivity(): void {
    this.fileService.upload(this.selectedFile!).pipe(
      catchError(err => {
        this.handleError('Не удалось загрузить новое изображение', err);
        throw err;
      })
    ).subscribe({
      next: (response) => {
        if (this.oldAvatarUrl)
          this.deleteOldAvatar(this.oldAvatarUrl);
        this.activityForm.patchValue({ avatarUrl: response.fileUrl });
        this.saveActivity();
      },
      error: error => this.handleError('Не удалось загрузить файл:', error)
    });
  }

  private saveActivity(): void {
    const formValue = this.activityForm.value;
    const activity: Activity = {
      ...formValue,
      authorId: this.userId,
      endAt: formValue.endAt ? DateService.formatDate(formValue.endAt) : null,
      tags: this.tags,
      targetAudience: this.targetAudience,
      checkList: this.checkList,
      infoCards: this.infoCards,
      topics: this.topics,
      minimalScore: formValue.minimalScore || 0
    };

    if (this.activityId)
      activity.id = this.activityId;

    const saveObservable = this.activityId
      ? this.activitiesService.updateActivity(this.activityId, activity)
      : this.activitiesService.createActivity(activity);

    saveObservable.subscribe({
      next: () => {
        this.alertService.showSnackBar(`Активность успешно ${this.activityId ? 'обновлена' : 'создана'}!`);
        this.router.navigate(['/activities']);
      },
      error: (err) => this.handleError('Не удалось сохранить активность', err)
    });
  }

  private deleteOldAvatar(oldAvatarUrl: string): void {
    this.fileService.delete(oldAvatarUrl).pipe(
      catchError(err => {
        this.handleError('Не удалось удалить старый аватар:', err);
        return of(null);
      })
    ).subscribe();
  }

  private handleError(message: string, error: Error | null = null): void {
    this.alertService.showSnackBar(message);
    if (error)
      console.error(message, error);
  }
}
