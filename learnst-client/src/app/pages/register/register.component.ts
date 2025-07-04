import {AfterViewInit, Component, ElementRef, inject, signal, ViewChild} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidatorFn,
  Validators
} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatNativeDateModule} from '@angular/material/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';
import {Router, RouterLink} from '@angular/router';
import {catchError, of} from 'rxjs';
import {Role} from '../../../data/enums/Role';
import {MediumScreenSupport} from '../../../data/helpers/MediumScreenSupport';
import {Return} from '../../../data/helpers/Return';
import {AlertService} from '../../../data/services/alert.service';
import {AuthService} from '../../../data/services/auth.service';
import {DateService} from '../../../data/services/date.service';
import {EmailService} from '../../../data/services/email.service';
import {ValidationService} from '../../../data/services/validation.service';
import {Location} from '@angular/common';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatIconModule} from '@angular/material/icon';
import {UsersService} from '../../../data/services/users.service';
import {User} from '../../../data/models/User';
import {ColorsService} from '../../../data/services/colors.service';
import {TurnstileService} from '../../../data/services/turnstile.service';
import {Status} from '../../../data/enums/Status';
import {LogService} from '../../../data/services/log.service';

@Return()
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [
    RouterLink,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule
  ]
})
export class RegisterComponent extends MediumScreenSupport implements AfterViewInit {
  form: FormGroup;
  loading = signal(false);
  hidePassword = signal(true);
  @ViewChild('turnstileContainer') turnstileContainer!: ElementRef;
  private logService = inject(LogService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private emailService = inject(EmailService);
  private usersService = inject(UsersService);
  private turnstile = inject(TurnstileService);

  constructor(private router: Router, public location: Location) {
    super();
    this.form = new FormGroup({
      username: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        ValidationService.usernameValidator
      ], [ValidationService.uniqueUsernameValidator(this.usersService)]),
      email: new FormControl('', [
        Validators.required,
        Validators.email,
        ValidationService.domainValidator
      ], [ValidationService.uniqueEmailValidator(this.usersService)]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        ValidationService.passwordValidator
      ]),
      repeatPassword: new FormControl('', [
        Validators.required
      ]),
      cfToken: new FormControl('', Validators.required)
    }, {
      validators: [this.matchValidator('password', 'repeatPassword')],
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.initTurnstile(), 0);
  }

  async onSubmit() {
    Object.values(this.form.controls).forEach(control => {
      control.markAsTouched();
      control.updateValueAndValidity();
    });

    if (!this.form.value.cfToken) {
      this.form.get('cfToken')?.setErrors({required: true});
      this.alertService.showSnackBar('Пройдите проверку безопасности');
      this.turnstile.reset();
      return;
    }

    if (this.form.invalid || this.loading()) {
      this.turnstile.reset();
      return;
    }

    this.loading.set(true); // Включаем состояние загрузки

    const formValue = this.form.value;
    const dateOfBirth = DateService.formatDate(formValue.dateOfBirth);

    const user: User = {
      ip: '',
      tickets: [],
      isHidden: true,
      educations: [],
      userLessons: [],
      userAnswers: [],
      role: Role.User,
      themeId: 'light',
      ticketAnswers: [],
      userActivities: [],
      workExperiences: [],
      status: Status.Online,
      createdAt: new Date(),
      socialMediaProfiles: [],
      dateOfBirth: dateOfBirth!,
      username: formValue.username,
      emailAddress: formValue.email,
      passwordHash: formValue.password,
      banner: ColorsService.generateColor()
    };

    // Шаг 1: Отправляем код подтверждения
    this.emailService.sendVerificationCode(user.emailAddress!).pipe(
      catchError(err => {
        this.alertService.showSnackBar('Ошибка при отправке кода подтверждения.');
        this.logService.errorWithData(err);
        return of(null);
      })
    ).subscribe(codeResponse => {
      if (!codeResponse) {
        this.loading.set(false); // Выключаем состояние загрузки, если код не отправлен
        return;
      }

      // Шаг 2: Открываем диалог для ввода кода
      this.alertService.openVerificationCodeDialog(user.emailAddress!).afterClosed().subscribe(result => {
        if (result === 0) {
          this.alertService.showSnackBar("Вы отказались от подтверждения почты.");
          this.loading.set(false); // Выключаем состояние загрузки
          return; // Пользователь закрыл диалог
        }

        // Шаг 3: Проверяем код
        if (codeResponse.code === result?.toString()) {
          // Если код введен правильно, продолжаем создание пользователя
          this.usersService.createUser(user).pipe(
            catchError(err => {
              this.logService.errorWithData('Полная ошибка:', err);
              const error = err?.message ?? 'Произошла ошибка при регистрации. Попробуйте еще раз.';
              this.alertService.showSnackBar(error);
              this.loading.set(false);
              return of(null);
            })
          ).subscribe(registeredUser => {
            this.loading.set(false); // Выключаем состояние загрузки

            if (registeredUser) {
              this.authService.login(user.username, user.passwordHash!).subscribe();
              this.alertService.showSnackBar(`Добро пожаловать, ${user.username}!`);
              this.router.navigate(['/']);
            }
          });
        } else {
          this.alertService.showSnackBar('Неверный код');
          this.loading.set(false); // Выключаем состояние загрузки
        }
      });
    });
  }

  matchValidator(controlName: string, matchingControlName: string): ValidatorFn {
    return (abstractControl: AbstractControl) => {
      const control = abstractControl.get(controlName);
      const matchingControl = abstractControl.get(matchingControlName);

      if (matchingControl!.errors && !matchingControl!.errors?.['passwordsDontMatch'])
        return null;

      if (control!.value !== matchingControl!.value) {
        matchingControl!.setErrors({passwordsDontMatch: true});
        return {passwordsDontMatch: true};
      }

      matchingControl!.setErrors(null);
      return null;
    }
  }

  openEmailHelp(): void {
    this.alertService.openMessageDialog(
      'О поддерживаемых доменах',
      'На платформе Learnst в качестве безопасности поддерживаются только следующие домены: mail.ru, xmail.ru, gmail.com, vk.com, yandex.ru, icloud.com.'
    );
  }

  private initTurnstile() {
    try {
      this.turnstile.init(
        'cf-turnstile',
        '0x4AAAAAAA-lpuh_BYavc73X',
        token => {
          this.form.patchValue({cfToken: token});
          this.form.get('cfToken')?.markAsTouched();
        }
      );
    } catch (error) {
      if (!(error instanceof Error)) return;
      this.logService.errorWithData('Ошибка инициализации Turnstile:', error);
      this.alertService.showSnackBar('Ошибка инициализации защиты. Перезагрузите страницу.');
    }
  }
}
