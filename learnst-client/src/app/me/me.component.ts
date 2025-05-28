import {DeviceType} from '../../models/DeviceType';
import {Location, NgClass} from '@angular/common';
import {Component, ElementRef, HostListener, inject, OnInit, signal, ViewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatDatepicker, MatDatepickerModule} from '@angular/material/datepicker';
import {MatDialog} from '@angular/material/dialog';
import {MatFormField} from '@angular/material/form-field';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatMenuModule} from '@angular/material/menu';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import {Router} from '@angular/router';
import bcrypt from 'bcryptjs';
import {forkJoin, map, Observable} from 'rxjs';
import {of} from 'rxjs/internal/observable/of';
import {catchError} from 'rxjs/internal/operators/catchError';
import {InspectableDirective} from '../../directives/inspectable.directive';
import {NoDownloadingDirective} from '../../directives/no-downloading.directive';
import {PlaceholderImageDirective} from '../../directives/placeholder-image.directive';
import {SocialMediaPlatform} from '../../enums/SocialMediaPlatform';
import {CanComponentDeactivate} from '../../helpers/CanComponentDeactivate';
import {MediumScreenSupport} from '../../helpers/MediumScreenSupport';
import {Return} from '../../helpers/Return';
import {SocialMediaPlatformHelper} from '../../helpers/SocialMediaPlatformHelper';
import {Education} from '../../models/Education';
import {SocialMediaProfile} from '../../models/SocialMediaProfile';
import {User} from '../../models/User';
import {WorkExperience} from '../../models/WorkExperience';
import {DateRangePipe} from '../../pipes/date.range.pipe';
import {AlertService} from '../../services/alert.service';
import {AuthService} from '../../services/auth.service';
import {DateService} from '../../services/date.service';
import {EmailService} from '../../services/email.service';
import {FileService} from '../../services/file.service';
import {UsersService} from '../../services/users.service';
import {ThemePickerComponent} from '../theme-picker/theme-picker.component';
import {EducationDialogComponent} from './education.dialog/education.dialog.component';
import {SocialMediaDialogComponent} from './social.media.dialog/social.media.dialog.component';
import {WorkExperienceDialogComponent} from './work.experience.dialog/work.experience.dialog.component';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {ThemeService} from '../../services/theme.service';
import {DeviceService} from '../../services/device.service';
import {AudioService} from '../../services/audio.service';
import {MatSliderModule} from '@angular/material/slider';
import {StatusHelper} from '../../helpers/StatusHelper';
import {Status} from '../../enums/Status';
import {RuDatePipe} from '../../pipes/ru.date.pipe';
import {Role} from '../../enums/Role';
import {TicketStatus} from '../../enums/TicketStatus';
import {TicketType} from '../../enums/TicketType';
import {LogService} from '../../services/log.service';

@Return()
@Component({
  selector: 'app-me',
  templateUrl: './me.component.html',
  styleUrls: ['./me.component.scss'],
  imports: [
    NgClass,
    RuDatePipe,
    FormsModule,
    MatFormField,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    DateRangePipe,
    MatInputModule,
    MatButtonModule,
    MatSliderModule,
    MatTooltipModule,
    MatGridListModule,
    MatDatepickerModule,
    InspectableDirective,
    ThemePickerComponent,
    MatSlideToggleModule,
    NoDownloadingDirective,
    MatProgressSpinnerModule,
    PlaceholderImageDirective
  ]
})
export class MeComponent extends MediumScreenSupport implements OnInit, CanComponentDeactivate {
  audioService = inject(AudioService);
  themeService = inject(ThemeService);
  userId = '';
  goBack!: () => void;
  selectedFile?: File;
  originalUser?: User;
  oldPassword = '';
  newPassword = '';
  hidePassword = true;
  changesSaving = false;
  unsavedChanges = false;
  passwordChanging = false;
  readonly maxDate = new Date();
  created = signal(0);
  enrolled = signal(0);
  completed = signal(0);
  loading = signal(true);
  readonly minDate = new Date(1900, 0, 1);
  followersCount = signal(0);
  user = signal<User | null>(null);
  @ViewChild('importFile') importFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild(MatDatepicker<Date | null>) picker!: MatDatepicker<Date | null>;
  protected readonly SocialMediaPlatformHelper = SocialMediaPlatformHelper;
  protected readonly StatusHelper = StatusHelper;
  protected readonly Status = Status;
  private dialog = inject(MatDialog);
  private logService = inject(LogService);
  private fileService = inject(FileService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private emailService = inject(EmailService);
  private usersService = inject(UsersService);
  private deviceService = inject(DeviceService);
  isDesktop = signal(this.deviceService.getDeviceType() === DeviceType.Desktop);

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
    this.authService.getUser().subscribe(user => {
      if (!user) return;
      this.userId = user.id!;
      this.originalUser = JSON.parse(JSON.stringify(user));
      this.usersService.getUserById(this.userId).pipe(
        catchError(() => {
          this.loading.set(false);
          return of(null);
        })
      ).subscribe(user => {
        this.user.set(user);
        this.usersService.getFollowersCount(this.userId).subscribe(count => {
          this.usersService.getUserStats(this.userId).subscribe(userStats => {
            this.created.set(userStats.created);
            this.enrolled.set(userStats.enrolled);
            this.completed.set(userStats.completed);
          });
          this.followersCount.set(count);
          this.loading.set(false);
        });
      });
    });
  }

  canDeactivate(): boolean {
    return !this.unsavedChanges;
  }

  // Отслеживаем попытку закрыть или обновить страницу
  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: BeforeUnloadEvent): void {
    if (!this.unsavedChanges) return;
    event.preventDefault();
  }

  clearDate(): void {
    this.picker.select(null);
  }

  // Метод для установки несохраненных изменений
  onUserInfoChange(): void {
    this.unsavedChanges = this.hasUserChanged();
  }

  // Метод для открытия файлового диалога
  openFilePicker(): void {
    const fileInput = document.getElementById('avatarInput') as HTMLInputElement;
    if (fileInput)
      fileInput.click();
  }

  // Метод для обработки выбора файла
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = (e) => {
        if (!this.user()) return;
        this.user()!.avatarUrl = e.target!.result as string; // Временное отображение нового аватара
        this.onUserInfoChange();
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  // Метод для изменения пароля
  changePassword(): void {
    if (!this.user) return;

    // Проверка данных пользователя перед обновлением пароля
    if (!this.newPassword) {
      // Если новый пароль не указан
      this.alertService.showSnackBar('Пожалуйста, введите новый пароль');
      return;
    }

    if (!this.oldPassword && this.user()?.passwordHash) {
      // Если пользователь авторизован по паролю, но старый пароль не указан
      this.alertService.showSnackBar('Пожалуйста, введите старый пароль');
      return;
    }

    if (this.oldPassword === this.newPassword) {
      // Если старый и новый пароли одинаковы
      this.alertService.showSnackBar('Старый и новый пароль не должны совпадать');
      return;
    }

    if (this.user()?.passwordHash && // У пользователя уже есть сохраненный пароль
      !bcrypt.compareSync(this.oldPassword, this.user()!.passwordHash || '')) { // Старый пароль не совпадает с хэшем
      this.alertService.showSnackBar('Старый пароль введен неверно');
      return;
    }

    this.passwordChanging = true;

    // Обновляем пароль на сервере
    this.usersService.updateUserPassword({
      userId: this.userId,
      password: this.newPassword
    }).pipe(
      catchError(err => {
        this.alertService.showSnackBar(err.error.message);
        this.logService.errorWithData(err);
        return of(null);
      })
    ).subscribe(updateUserResponse => {
      this.passwordChanging = false;

      if (!updateUserResponse || !updateUserResponse.succeed) {
        this.alertService.showSnackBar('Не удалось изменить пароль');
        this.logService.errorWithData(updateUserResponse?.message);
        return;
      }

      this.alertService.showSnackBar('Пароль успешно изменен');
      this.oldPassword = '';
      this.newPassword = '';
      this.user()!.passwordHash = updateUserResponse.message!;
    });
  }

  // Метод для открытия модального окна образования
  openEducationModal(education?: Education): void {
    const dialogRef = this.dialog.open(EducationDialogComponent, {
      width: '500px',
      data: {
        education: education || {
          id: 0,
          institutionName: '',
          degree: '',
          graduationYear: new Date().getFullYear(),
          userId: this.userId
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      if (education)
        this.updateEducation(result);
      else
        this.addEducation(result);
    });
  }

  // Метод для открытия модального окна опыта работы
  openWorkExperienceModal(workExperience?: WorkExperience): void {
    const dialogRef = this.dialog.open(WorkExperienceDialogComponent, {
      width: '500px',
      data: {
        workExperience: workExperience || {
          id: 0,
          companyName: '',
          position: '',
          description: '',
          startDate: '',
          endDate: '',
          userId: this.userId
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      if (workExperience)
        this.updateWorkExperience(result);
      else
        this.addWorkExperience(result);
    });
  }

  // Метод для открытия модального окна социальных сетей
  openSocialMediaModal(socialMedia?: SocialMediaProfile): void {
    const dialogRef = this.dialog.open(SocialMediaDialogComponent, {
      width: '500px',
      data: {socialMedia: socialMedia || {id: 0, url: '', platform: SocialMediaPlatform.Bluesky, userId: this.userId}}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      if (socialMedia)
        this.updateSocialMedia(result);
      else
        this.addSocialMedia(result);
    });
  }

  // Метод для добавления образования
  addEducation(education: Education): void {
    if (!this.user) return;
    this.user()?.educations.push(education);
    this.onUserInfoChange();
  }

  // Метод для обновления образования
  updateEducation(education: Education): void {
    if (!this.user) return;
    const index = this.user()?.educations
      .findIndex(e => e.id === education.id)!;
    if (index === -1) return;
    this.user()!.educations[index] = education;
    this.onUserInfoChange();
  }

  // Метод для добавления опыта работы
  addWorkExperience(workExperience: WorkExperience): void {
    if (!this.user) return;
    this.user()!.workExperiences.push(workExperience);
    this.onUserInfoChange();
  }

  // Метод для обновления опыта работы
  updateWorkExperience(workExperience: WorkExperience): void {
    if (!this.user) return;
    const index = this.user()?.workExperiences
      .findIndex(w => w.id === workExperience.id)!;
    if (index === -1) return;
    this.user()!.workExperiences[index] = workExperience;
    this.onUserInfoChange();
  }

  // Метод для добавления социальной сети
  addSocialMedia(socialMedia: SocialMediaProfile): void {
    if (!this.user) return;
    this.user()?.socialMediaProfiles.push(socialMedia);
    this.onUserInfoChange();
  }

  // Метод для обновления социальной сети
  updateSocialMedia(socialMedia: SocialMediaProfile): void {
    if (!this.user) return;
    const index = this.user()?.socialMediaProfiles
      .findIndex(s => s.id === socialMedia.id)!;
    if (index === -1) return;
    this.user()!.socialMediaProfiles[index] = socialMedia;
    this.onUserInfoChange();
  }

  // Метод для удаления образования
  deleteEducation(education: Education): void {
    this.alertService.openConfirmDialog(
      AlertService.CONFIRM_TITLE,
      'Вы уверены, что хотите удалить образование?'
    ).afterClosed().subscribe(confirmed => {
      if (!this.user || !confirmed) return;
      this.user()!.educations = this.user()?.educations
        .filter(e => e.id !== education.id)!;
      this.onUserInfoChange();
    });
  }

  // Метод для удаления опыта работы
  deleteWorkExperience(workExperience: WorkExperience): void {
    this.alertService.openConfirmDialog(
      AlertService.CONFIRM_TITLE,
      'Вы уверены, что хотите удалить опыт работы?'
    ).afterClosed().subscribe(confirmed => {
      if (!this.user || !confirmed) return;
      this.user()!.workExperiences = this.user()?.workExperiences
        .filter(w => w.id !== workExperience.id)!;
      this.onUserInfoChange();
    });
  }

  // Метод для удаления социальной сети
  deleteSocialMedia(socialMedia: SocialMediaProfile): void {
    this.alertService.openConfirmDialog(
      AlertService.CONFIRM_TITLE,
      'Вы уверены, что хотите удалить опыт работы?'
    ).afterClosed().subscribe(confirmed => {
      if (!this.user || !confirmed) return;
      this.user()!.socialMediaProfiles = this.user()?.socialMediaProfiles
        .filter(s => s.id !== socialMedia.id)!;
      this.onUserInfoChange();
    });
  }

  // Метод для сохранения изменений
  saveChanges(): void {
    if (!this.hasUserChanged()) return;

    this.changesSaving = true;

    this.checkDuplicates(this.user()!).subscribe(({emailTaken, usernameTaken}) => {
      if (emailTaken) {
        this.alertService.showSnackBar('Эта почта уже занята');
        this.changesSaving = false;
        return;
      }

      if (usernameTaken) {
        this.alertService.showSnackBar('Это имя уже занято');
        this.changesSaving = false;
        return;
      }

      if (this.user()?.emailAddress && this.user()?.emailAddress !== this.originalUser?.emailAddress)
        this.verifyEmail();
      else
        this.proceedWithSave();
    });
  }

  deleteProfile(): void {
    if (!this.user()?.id) {
      this.alertService.showSnackBar('User ID не определено');
      return;
    }

    this.alertService.openConfirmDialog(
      AlertService.CONFIRM_TITLE,
      'Вы уверены, что хотите удалить свой аккаунт? Это действие необратимо.'
    ).afterClosed().subscribe(confirmed => {
      if (!confirmed || !this.user()) return;

      this.usersService.deleteUser(this.user()?.id!).subscribe({
        next: () => {
          this.alertService.showSnackBar(`Аккаунт ${this.user()?.username} успешно удалён.`);
          this.authService.removeAccount(this.user()?.id!);
          this.router.navigate(['/login']);
        },
        error: err => {
          this.alertService.showSnackBar('Не удалось удалить аккаунт.');
          this.logService.errorWithData(err);
          return of(null);
        }
      });
    });
  }

  toggleVisibility() {
    this.user.update(user => ({
      ...user!,
      isHidden: !this.user()?.isHidden
    }));
    this.onUserInfoChange();
  }

  exportData(format: 'json' | 'xml'): void {
    if (!this.user) return;

    try {
      const data = this.prepareExportData();
      let content: string;
      let mimeType: string;
      let extension: string;

      if (format === 'json') {
        content = JSON.stringify(data, this.jsonReplacer, 2);
        mimeType = 'application/json';
        extension = 'json';
      } else {
        content = this.convertToXml(data);
        mimeType = 'application/xml';
        extension = 'xml';
      }

      this.saveFile(content, mimeType, `user_profile_${new Date().toISOString()}.${extension}`);
    } catch (error) {
      if (!(error instanceof Error)) return;
      this.alertService.showSnackBar('Ошибка при генерации файла');
      this.logService.errorWithData('Export error:', error);
    }
  }

  setVolumeFromEvent(event: Event): void {
    this.audioService.setVolume(parseFloat((event.target as HTMLInputElement).value));
  }

  private prepareExportData(): any {
    const user = this.user()!;
    return {
      copyright: `© ${new Date().getFullYear()} RomaSharper. All rights reserved.`,
      exportDate: new Date().toISOString(),
      version: '2.0',
      user: {
        // Основная информация
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        emailAddress: user.emailAddress,
        role: Role[user.role],
        status: Status[user.status],
        isHidden: user.isHidden,
        createdAt: user.createdAt,

        // Персональные данные
        avatarUrl: user.avatarUrl,
        dateOfBirth: user.dateOfBirth,
        city: user.city,
        resumeText: user.resumeText,
        aboutMe: user.aboutMe,
        banner: user.banner,

        // Социальные сети и аутентификация
        externalLoginId: user.externalLoginId,
        externalLoginType: user.externalLoginType !== undefined
          ? SocialMediaPlatform[user.externalLoginType]
          : undefined,
        socialMediaProfiles: user.socialMediaProfiles.map(p => ({
          url: p.url,
          platform: SocialMediaPlatform[p.platform]
        })),

        // Образование и опыт работы
        educations: user.educations.map(e => ({
          degree: e.degree,
          graduationYear: e.graduationYear,
          institutionName: e.institutionName
        })),
        workExperiences: user.workExperiences.map(w => ({
          endDate: w.endDate,
          position: w.position,
          startDate: w.startDate,
          companyName: w.companyName,
          description: w.description
        })),

        // Активности и прогресс
        userActivities: user.userActivities.map(ua => ({
          activityId: ua.activityId,
          assignedAt: ua.assignedAt
        })),
        userLessons: user.userLessons,

        // Тикеты и ответы
        tickets: user.tickets.map(t => ({
          id: t.id,
          title: t.title,
          createdAt: t.createdAt,
          type: TicketType[t.type],
          description: t.description,
          status: TicketStatus[t.status]
        })),
        ticketAnswers: user.ticketAnswers.map(ta => ({
          id: ta.id,
          content: ta.content,
          ticketId: ta.ticketId,
          createdAt: ta.createdAt
        })),

        // Настройки
        theme: { id: user.themeId }
      }
    };
  }

  private jsonReplacer(key: string, value: any): any {
    if (key === 'user') return value; // Убираем циклические ссылки
    return value instanceof Date ? value.toISOString() : value;
  }

  private saveFile(content: string, mimeType: string, filename: string): void {
    const blob = new Blob([content], {type: mimeType});
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  private convertToXml(data: any): string {
    const buildXmlNode = (obj: any, nodeName: string, indent: string): string => {
      if (obj === null || obj === undefined) return '';

      if (Array.isArray(obj))
        return obj.map(item => buildXmlNode(item, nodeName, indent)).join('\n');

      if (typeof obj === 'object') {
        const entries = Object.entries(obj)
          .filter(([_, v]) => v !== null && v !== undefined);

        if (!entries.length) return `${indent}<${nodeName}/>`;

        const children = entries.map(([key, val]) => buildXmlNode(val, key, `${indent}  `))
          .join('\n');

        return `${indent}<${nodeName}>\n${children}\n${indent}</${nodeName}>`;
      }

      return `${indent}<${nodeName}>${this.escapeXml(obj.toString())}</${nodeName}>`;
    };

    return `<?xml version="1.0" encoding="UTF-8"?>\n` +
      buildXmlNode(data, 'UserData', '');
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, c => {
      switch (c) {
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '&':
          return '&amp;';
        case '\'':
          return '&apos;';
        case '"':
          return '&quot;';
        default:
          return c;
      }
    });
  }

  // Метод для проверки дубликатов
  private checkDuplicates(user: User): Observable<{ emailTaken: boolean, usernameTaken: boolean }> {
    return forkJoin({
      emailTaken: user.emailAddress ? this.usersService.getUserByEmail(user.emailAddress).pipe(
        map(user => !!user && user.id !== this.userId),
        catchError(() => of(false))
      ) : of(false),
      usernameTaken: this.usersService.getUserByName(user.username).pipe(
        map(user => !!user && user.id !== this.userId),
        catchError(() => of(false))
      )
    });
  }

  private hasUserChanged(): boolean {
    if (!this.user() || !this.originalUser) return false;

    // Сравниваем основные поля
    const basicFieldsChanged =
      this.user()!.emailAddress !== this.originalUser.emailAddress ||
      this.user()!.username !== this.originalUser.username ||
      this.user()!.fullName !== this.originalUser.fullName ||
      DateService.formatDate(this.user()!.dateOfBirth) !== DateService.formatDate(this.originalUser.dateOfBirth) ||
      this.user()!.city !== this.originalUser.city ||
      this.user()!.resumeText !== this.originalUser.resumeText ||
      this.user()!.aboutMe !== this.originalUser.aboutMe ||
      this.user()!.isHidden !== this.originalUser.isHidden;

    // Сравниваем аватар
    const avatarChanged = this.user()?.avatarUrl !== this.originalUser.avatarUrl;

    // Сравниваем массивы (образование, опыт работы, социальные сети)
    const educationsChanged = JSON.stringify(this.user()?.educations)
      !== JSON.stringify(this.originalUser.educations);
    const workExperiencesChanged = JSON.stringify(this.user()?.workExperiences)
      !== JSON.stringify(this.originalUser.workExperiences);
    const socialMediaProfilesChanged = JSON.stringify(this.user()?.socialMediaProfiles)
      !== JSON.stringify(this.originalUser.socialMediaProfiles);

    // Если хотя бы одно поле изменилось, возвращаем true
    return (
      basicFieldsChanged ||
      avatarChanged ||
      educationsChanged ||
      workExperiencesChanged ||
      socialMediaProfilesChanged
    );
  }

  private verifyEmail() {
    // Шаг 1: Отправляем код подтверждения
    return this.user && this.emailService.sendVerificationCode(this.user()?.emailAddress!).pipe(
      catchError(errorObj => {
        this.alertService.showSnackBar('Ошибка при отправке кода подтверждения.');
        this.changesSaving = false;
        this.logService.errorWithData(errorObj);
        return of(null);
      })
    ).subscribe(codeResponse => {
      if (!codeResponse) return; // Если ошибка, выходим

      // Шаг 2: Открываем диалог для ввода кода
      this.alertService.openVerificationCodeDialog(this.user()!.emailAddress!).afterClosed().subscribe(result => {
        if (result === 0) {
          this.alertService.showSnackBar('Почта не была подтверждена. Изменения не сохранены.');
          this.changesSaving = false;
          return; // Пользователь закрыл диалог
        }

        // Шаг 3: Проверяем код
        if (codeResponse.code === result?.toString())
          // Если код введен правильно, продолжаем обновление пользователя
          this.proceedWithSave();
        else {
          this.alertService.showSnackBar('Вы ввели неверный код');
          this.changesSaving = false;
        }
      });
    });
  }

  private proceedWithSave() {
    // Если аватар не изменился, сразу обновляем пользователя
    if (this.originalUser?.avatarUrl === this.user()?.avatarUrl) {
      this.updateUserData();
      return;
    }

    // Если выбран новый файл, загружаем его
    if (this.selectedFile) {
      this.fileService.upload(this.selectedFile).pipe(
        catchError(err => {
          this.alertService.showSnackBar('Не удалось загрузить новое изображение.');
          this.logService.errorWithData(err);
          this.changesSaving = false;
          throw err;
        })
      ).subscribe({
        next: (response) => {
          if (this.originalUser?.avatarUrl)
            this.deleteOriginalAvatar(this.originalUser.avatarUrl); // Удаляем старый аватар
          if (response)
            this.user()!.avatarUrl = response.fileUrl; // Обновляем URL аватара
          this.updateUserData(); // Обновляем данные пользователя
        },
        error: error => {
          this.alertService.showSnackBar('Не удалось загрузить файл');
          this.logService.errorWithData('Не удалось загрузить файл:', error);
          this.changesSaving = false;
        }
      });
      return;
    }

    // Если файл не выбран, сразу обновляем пользователя
    this.updateUserData();
  }

  private updateUserData(): void {
    if (!this.user()) return;
    this.unsavedChanges = false;
    this.user()!.dateOfBirth = DateService.formatDate(this.user()!.dateOfBirth)!;

    this.usersService.updateUser(this.userId, this.user()!).pipe(
      catchError(err => {
        this.changesSaving = false;
        this.alertService.showSnackBar(err.error.message || 'Не удалось обновить данные.');
        this.logService.errorWithData(err);
        return of(null); // Возвращаем null, чтобы завершить поток
      })
    ).subscribe(updatedResponse => {
      this.changesSaving = false;

      // Ошибка уже обработана в catchError
      if (!updatedResponse)
        return;

      if (!updatedResponse.succeed) {
        this.alertService.showSnackBar(updatedResponse.message || 'Не удалось обновить данные.');
        return;
      }

      if (!updatedResponse.user) {
        this.alertService.showSnackBar('Данные пользователя не были возвращены.');
        return;
      }

      this.user.set(updatedResponse.user);
      this.authService.setUser(updatedResponse.user);
      this.alertService.showSnackBar('Данные обновлены успешно.');
    });
  }

  // Метод для удаления старого аватара
  private deleteOriginalAvatar(originalAvatarUrl: string): void {
    this.fileService.delete(originalAvatarUrl).subscribe();
  }
}
