import { Location } from '@angular/common';
import { Component, HostListener, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import bcrypt from 'bcryptjs';
import { forkJoin, map, Observable } from 'rxjs';
import { of } from 'rxjs/internal/observable/of';
import { catchError } from 'rxjs/internal/operators/catchError';
import { NoDownloadingDirective } from '../../directives/NoDownloadingDirective';
import { PlaceholderImageDirective } from '../../directives/PlaceholderImageDirective';
import { SocialMediaPlatform } from '../../enums/SocialMediaPlatform';
import { CanComponentDeactivate } from '../../helpers/CanComponentDeactivate';
import { MediumScreenSupport } from '../../helpers/MediumScreenSupport';
import { Return } from '../../helpers/Return';
import { SocialMediaPlatformHelper } from '../../helpers/SocialMediaPlatformHelper';
import { Education } from '../../models/Education';
import { SocialMediaProfile } from '../../models/SocialMediaProfile';
import { User } from '../../models/User';
import { WorkExperience } from '../../models/WorkExperience';
import { DateRangePipe } from '../../pipes/date.range.pipe';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { DateService } from '../../services/date.service';
import { EmailService } from '../../services/email.service';
import { FileService } from '../../services/file.service';
import { UsersService } from '../../services/users.service';
import { ThemePickerComponent } from '../theme-picker/theme-picker.component';
import { EducationDialogComponent } from './education.dialog/education.dialog.component';
import { SocialMediaDialogComponent } from './social.media.dialog/social.media.dialog.component';
import { WorkExperienceDialogComponent } from './work.experience.dialog/work.experience.dialog.component';
import { SubscriptionsComponent } from '../subscription/subscription.component';
import { PluralPipe } from '../../pipes/plural.pipe';

@Return()
@Component({
  selector: 'app-me',
  templateUrl: './me.component.html',
  styleUrls: ['./me.component.scss'],
  imports: [
    PluralPipe,
    FormsModule,
    MatFormField,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    DateRangePipe,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    MatGridListModule,
    MatDatepickerModule,
    ThemePickerComponent,
    SubscriptionsComponent,
    NoDownloadingDirective,
    MatProgressSpinnerModule,
    PlaceholderImageDirective,
  ]
})
export class MeComponent extends MediumScreenSupport implements OnInit, CanComponentDeactivate {
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private fileService = inject(FileService);
  private alertService = inject(AlertService);
  private emailService = inject(EmailService);
  private usersService = inject(UsersService);

  user?: User;
  userId = '';
  oldPassword = '';
  newPassword = '';
  goBack!: () => void;
  selectedFile?: File;
  originalUser?: User;
  hidePassword = true;
  changesSaving = false;
  unsavedChanges = false;
  passwordChanging = false;
  followersCount = signal(0);
  readonly maxDate = new Date();
  readonly minDate = new Date(1900, 0, 1);
  @ViewChild(MatDatepicker<Date | null>) picker!: MatDatepicker<Date | null>;

  SocialMediaPlatformHelper = SocialMediaPlatformHelper;

  constructor(public router: Router, public location: Location) { super(); }

  ngOnInit(): void {
    this.authService.getUser().subscribe(user => {
      if (!user) return;
      this.userId = user.id!;
      this.originalUser = JSON.parse(JSON.stringify(user));
      this.usersService.getUserById(this.userId).subscribe(user => this.user = user);
      this.usersService.getFollowersCount(this.userId).subscribe(count => this.followersCount.set(count));
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
        if (!this.user) return;
        this.user.avatarUrl = e.target!.result as string; // Временное отображение нового аватара
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

    if (!this.oldPassword && this.user.passwordHash) {
      // Если пользователь авторизован по паролю, но старый пароль не указан
      this.alertService.showSnackBar('Пожалуйста, введите старый пароль');
      return;
    }

    if (this.oldPassword === this.newPassword) {
      // Если старый и новый пароли одинаковы
      this.alertService.showSnackBar('Старый и новый пароль не должны совпадать');
      return;
    }

    if (
      this.user.passwordHash && // У пользователя уже есть сохраненный пароль
      !bcrypt.compareSync(this.oldPassword, this.user.passwordHash || '') // Старый пароль не совпадает с хэшем
    ) {
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
        console.error(err);
        return of(null);
      })
    ).subscribe(updateUserResponse => {
      this.passwordChanging = false;

      if (!updateUserResponse || !updateUserResponse.succeed) {
        this.alertService.showSnackBar('Не удалось изменить пароль');
        console.error(updateUserResponse?.message);
        return;
      }

      this.alertService.showSnackBar('Пароль успешно изменен');
      this.oldPassword = '';
      this.newPassword = '';
      this.user!.passwordHash = updateUserResponse.message!;
    });
  }

  // Метод для открытия модального окна образования
  openEducationModal(education?: Education): void {
    const dialogRef = this.dialog.open(EducationDialogComponent, {
      width: '500px',
      data: { education: education || { id: 0, institutionName: '', degree: '', graduationYear: new Date().getFullYear(), userId: this.userId } }
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
      data: { workExperience: workExperience || { id: 0, companyName: '', position: '', description: '', startDate: '', endDate: '', userId: this.userId } }
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
      data: { socialMedia: socialMedia || { id: 0, url: '', platform: SocialMediaPlatform.Bluesky, userId: this.userId } }
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
    this.user.educations.push(education);
    this.onUserInfoChange();
  }

  // Метод для обновления образования
  updateEducation(education: Education): void {
    if (!this.user) return;
    const index = this.user.educations.findIndex(e => e.id === education.id);
    if (index === -1) return;
    this.user.educations[index] = education;
    this.onUserInfoChange();
  }

  // Метод для добавления опыта работы
  addWorkExperience(workExperience: WorkExperience): void {
    if (!this.user) return;
    this.user.workExperiences.push(workExperience);
    this.onUserInfoChange();
  }

  // Метод для обновления опыта работы
  updateWorkExperience(workExperience: WorkExperience): void {
    if (!this.user) return;
    const index = this.user.workExperiences.findIndex(w => w.id === workExperience.id);
    if (index === -1) return;
    this.user.workExperiences[index] = workExperience;
    this.onUserInfoChange();
  }

  // Метод для добавления социальной сети
  addSocialMedia(socialMedia: SocialMediaProfile): void {
    if (!this.user) return;
    this.user.socialMediaProfiles.push(socialMedia);
    this.onUserInfoChange();
  }

  // Метод для обновления социальной сети
  updateSocialMedia(socialMedia: SocialMediaProfile): void {
    if (!this.user) return;
    const index = this.user.socialMediaProfiles.findIndex(s => s.id === socialMedia.id);
    if (index === -1) return;
    this.user.socialMediaProfiles[index] = socialMedia;
    this.onUserInfoChange();
  }

  // Метод для удаления образования
  deleteEducation(education: Education): void {
    this.alertService.openConfirmDialog(
      AlertService.CONFIRM_TITLE,
      'Вы уверены, что хотите удалить образование?'
    ).afterClosed().subscribe(confirmed => {
      if (!this.user || !confirmed) return;
      this.user.educations = this.user.educations.filter(e => e.id !== education.id);
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
      this.user.workExperiences = this.user.workExperiences.filter(w => w.id !== workExperience.id);
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
      this.user.socialMediaProfiles = this.user.socialMediaProfiles.filter(s => s.id !== socialMedia.id);
      this.onUserInfoChange();
    });
  }

  // Метод для сохранения изменений
  saveChanges(): void {
    if (!this.hasUserChanged()) return;

    this.changesSaving = true;

    this.checkDuplicates(this.user!).subscribe(({ emailTaken, usernameTaken }) => {
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

      if (this.user?.emailAddress && this.user?.emailAddress !== this.originalUser?.emailAddress)
        this.verifyEmail();
      else
        this.proceedWithSave();
    });
  }

  deleteProfile(): void {
    this.alertService.openConfirmDialog(
      AlertService.CONFIRM_TITLE,
      'Вы уверены, что хотите удалить свой аккаунт? Это действие необратимо.'
    ).afterClosed().subscribe(confirmed => {
      if (!confirmed || !this.user) return;

      this.usersService.deleteUser(this.user.id!).subscribe({
        next: () => {
          this.alertService.showSnackBar(`Аккаунт ${this.user?.username} успешно удалён.`);
          this.authService.removeAccount(this.user?.id!);
          this.router.navigate(['/login']);
        },
        error: err => {
          this.alertService.showSnackBar('Не удалось удалить аккаунт.');
          console.error(err);
          return of(null);
        }
      });
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
    if (!this.user || !this.originalUser) return false;

    // Сравниваем основные поля
    const basicFieldsChanged =
      this.user.emailAddress !== this.originalUser.emailAddress ||
      this.user.username !== this.originalUser.username ||
      this.user.fullName !== this.originalUser.fullName ||
      DateService.formatDate(this.user.dateOfBirth) !== DateService.formatDate(this.originalUser.dateOfBirth) ||
      this.user.city !== this.originalUser.city ||
      this.user.resumeText !== this.originalUser.resumeText ||
      this.user.aboutMe !== this.originalUser.aboutMe;

    // Сравниваем аватар
    const avatarChanged = this.user.avatarUrl !== this.originalUser.avatarUrl;

    // Сравниваем массивы (образование, опыт работы, социальные сети)
    const educationsChanged = JSON.stringify(this.user.educations) !== JSON.stringify(this.originalUser.educations);
    const workExperiencesChanged = JSON.stringify(this.user.workExperiences) !== JSON.stringify(this.originalUser.workExperiences);
    const socialMediaProfilesChanged = JSON.stringify(this.user.socialMediaProfiles) !== JSON.stringify(this.originalUser.socialMediaProfiles);

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
    return this.user && this.emailService.sendVerificationCode(this.user.emailAddress!).pipe(
      catchError(errorObj => {
        this.alertService.showSnackBar('Ошибка при отправке кода подтверждения.');
        console.error(errorObj);
        return of(null);
      })
    ).subscribe(codeResponse => {
      if (!codeResponse) return; // Если ошибка, выходим

      // Шаг 2: Открываем диалог для ввода кода
      this.alertService.openVerificationCodeDialog(this.user!.emailAddress!).afterClosed().subscribe(result => {
        if (result === 0) {
          this.alertService.showSnackBar('Почта не была подтверждена. Изменения не сохранены.');
          return; // Пользователь закрыл диалог
        }

        // Шаг 3: Проверяем код
        if (codeResponse.code === result?.toString())
          // Если код введен правильно, продолжаем обновление пользователя
          this.proceedWithSave();
        else
          this.alertService.showSnackBar('Вы ввели неверный код');
      });
    });
  }

  private proceedWithSave() {
    // Если аватар не изменился, сразу обновляем пользователя
    if (this.originalUser?.avatarUrl === this.user?.avatarUrl) {
      this.updateUserData();
      return;
    }

    // Если выбран новый файл, загружаем его
    if (this.selectedFile) {
      this.fileService.upload(this.selectedFile).pipe(
        catchError(err => {
          this.alertService.showSnackBar('Не удалось загрузить новое изображение.');
          console.error(err);
          this.changesSaving = false;
          throw err;
        })
      ).subscribe({
        next: (response) => {
          if (this.originalUser?.avatarUrl)
            this.deleteOriginalAvatar(this.originalUser.avatarUrl); // Удаляем старый аватар
          if (response)
            this.user!.avatarUrl = response.fileUrl; // Обновляем URL аватара
          this.updateUserData(); // Обновляем данные пользователя
        },
        error: error => {
          this.alertService.showSnackBar('Не удалось загрузить файл');
          console.error('Не удалось загрузить файл:', error);
          this.changesSaving = false;
        }
      });
      return;
    }

    // Если файл не выбран, сразу обновляем пользователя
    this.updateUserData();
  }

  private updateUserData(): void {
    if (!this.user) return;
    this.unsavedChanges = false;
    this.user.dateOfBirth = DateService.formatDate(this.user.dateOfBirth)!;

    this.usersService.updateUser(this.userId, this.user).pipe(
      catchError(err => {
        this.changesSaving = false;
        this.alertService.showSnackBar(err.error.message || 'Не удалось обновить данные.');
        console.error(err);
        return of(null); // Возвращаем null, чтобы завершить поток
      })
    ).subscribe(updatedResponse => {
      this.changesSaving = false;

      if (!updatedResponse) {
        // Ошибка уже обработана в catchError
        return;
      }

      if (!updatedResponse.succeed) {
        this.alertService.showSnackBar(updatedResponse.message || 'Не удалось обновить данные.');
        return;
      }

      if (!updatedResponse.user) {
        this.alertService.showSnackBar('Данные пользователя не были возвращены.');
        return;
      }

      this.user = updatedResponse.user;
      this.authService.setUser(updatedResponse.user);
      this.alertService.showSnackBar('Данные обновлены успешно.');
    });
  }

  // Метод для удаления старого аватара
  private deleteOriginalAvatar(originalAvatarUrl: string): void {
    this.fileService.delete(originalAvatarUrl).subscribe();
  }
}
