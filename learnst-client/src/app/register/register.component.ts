import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Role } from '../../enums/Role';
import { MediumScreenSupport } from '../../helpers/MediumScreenSupport';
import { Return } from '../../helpers/Return';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { DateService } from '../../services/date.service';
import { EmailService } from '../../services/email.service';
import { ValidationService } from '../../services/validation.service';
import { Location } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { UsersService } from '../../services/users.service';
import { User } from '../../models/User';
import { ColorsService } from '../../services/colors.service';

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
export class RegisterComponent extends MediumScreenSupport {
  form: FormGroup;
  loading = false;
  hidePassword = true;
  readonly maxDate = new Date();
  readonly minDate = new Date(1900, 0, 1);
  emailDomains = ValidationService.emailDomains;

  constructor(
    private authService: AuthService,
    private alertService: AlertService,
    private emailService: EmailService,
    private usersService: UsersService,
    public location: Location,
    public router: Router
  ) {
    super();
    this.form = new FormGroup({
      username: new FormControl('', [Validators.required, Validators.minLength(3), ValidationService.usernameValidator]),
      email: new FormControl('', [Validators.required, Validators.email, ValidationService.domainValidator]),
      password: new FormControl('', [Validators.required, Validators.minLength(8), ValidationService.passwordValidator]),
      repeatPassword: new FormControl('', [Validators.required]),
    }, {
      validators: [this.matchValidator('password', 'repeatPassword')],
    });
  }

  onSubmit() {
    if (this.form.invalid || this.loading) return;

    this.loading = true; // Включаем состояние загрузки

    const formValue = this.form.value;
    const dateOfBirth = DateService.formatDate(formValue.dateOfBirth);

    const user: User = {
      tickets: [],
      authCodes: [],
      educations: [],
      userLessons: [],
      userAnswers: [],
      role: Role.User,
      themeId: 'light',
      applications: [],
      ticketAnswers: [],
      userActivities: [],
      workExperiences: [],
      userSubscriptions: [],
      socialMediaProfiles: [],
      dateOfBirth: dateOfBirth!,
      username: formValue.username,
      emailAddress: formValue.email,
      passwordHash: formValue.password,
      banner: ColorsService.generateColor(),
      background: ColorsService.generateColor()
    };

    // Шаг 1: Отправляем код подтверждения
    this.emailService.sendVerificationCode(user.emailAddress!).pipe(
      catchError(errorObj => {
        this.alertService.showSnackBar('Ошибка при отправке кода подтверждения.');
        console.error(errorObj);
        return of(null);
      })
    ).subscribe(codeResponse => {
      if (!codeResponse) {
        this.loading = false; // Выключаем состояние загрузки, если код не отправлен
        return;
      }

      // Шаг 2: Открываем диалог для ввода кода
      this.alertService.openVerificationCodeDialog(user.emailAddress!).afterClosed().subscribe(result => {
        if (result === 0) {
          this.alertService.showSnackBar("Вы отказались от подтверждения почты.");
          this.loading = false; // Выключаем состояние загрузки
          return; // Пользователь закрыл диалог
        }

        // Шаг 3: Проверяем код
        if (codeResponse.code === result?.toString()) {
          // Если код введен правильно, продолжаем создание пользователя
          this.usersService.createUser(user).pipe(
            catchError(errorObj => {
              const error: string = errorObj?.error?.message ?? 'Произошла ошибка при регистрации. Попробуйте еще раз.';
              this.alertService.showSnackBar(error);
              this.loading = false; // Выключаем состояние загрузки при ошибке
              return of(null);
            })
          ).subscribe(registeredUser => {
            this.loading = false; // Выключаем состояние загрузки

            if (registeredUser) {
              this.authService.login(user.username, user.passwordHash!).subscribe();
              this.alertService.showSnackBar(`Добро пожаловать, ${user.username}!`);
              this.router.navigate(['/']);
            }
          });
        } else {
          this.alertService.showSnackBar('Неверный код');
          this.loading = false; // Выключаем состояние загрузки
        }
      });
    });
  }

  matchValidator(controlName: string, matchingControlName: string): ValidatorFn {
    return (abstractControl: AbstractControl) => {
      const control = abstractControl.get(controlName);
      const matchingControl = abstractControl.get(matchingControlName);

      if (matchingControl!.errors && !matchingControl!.errors?.['passwordsDontMatch']) {
        return null;
      }

      if (control!.value !== matchingControl!.value) {
        matchingControl!.setErrors({ passwordsDontMatch: true });
        return { passwordsDontMatch: true };
      }

      matchingControl!.setErrors(null);
      return null;
    }
  }
}
