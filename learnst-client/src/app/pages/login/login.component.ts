import {Component, computed, inject, signal} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import {Router, RouterLink} from '@angular/router';
import {catchError, of} from 'rxjs';
import {NoDownloadingDirective} from '../../../angular/directives/no-downloading.directive';
import {AlertService} from '../../../data/services/alert.service';
import {AuthService} from '../../../data/services/auth.service';
import {ValidationService} from '../../../data/services/validation.service';
import {AccountsManagerComponent} from '../../widgets/accounts-manager/accounts-manager.component';
import {UsersService} from '../../../data/services/users.service';
import {MatDialog} from '@angular/material/dialog';
import {EmailService} from '../../../data/services/email.service';
import {ResetPasswordEmailDialogComponent} from '../../dialogs/reset-password-email-dialog/reset-password-email-dialog.component';
import {
  ResetPasswordNewPasswordDialogComponent
} from '../../dialogs/reset-password-new-password-dialog/reset-password-new-password-dialog.component';
import {LogService} from '../../../data/services/log.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    RouterLink,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    ReactiveFormsModule,
    NoDownloadingDirective,
    MatProgressSpinnerModule,
    AccountsManagerComponent
  ]
})
export class LoginComponent {
  private code = '';
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private logService = inject(LogService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private emailService = inject(EmailService);
  private usersService = inject(UsersService);

  loading = signal(false);
  hidePassword = signal(true);
  accounts = this.authService.accounts;
  manyAccounts = computed(() => this.accounts()!.length >= 5);
  form = new FormGroup({
    login: new FormControl('', [Validators.required, ValidationService.loginValidator]),
    password: new FormControl('', [Validators.required])
  });

  onSubmit() {
    if (this.form.invalid) {
      this.alertService.showSnackBar('Пожалуйста, заполните все поля корректно.');
      return;
    }

    this.loading.set(true);
    const formValue = this.form.value;
    this.authService.login(formValue.login!, formValue.password!)
      .pipe(
        catchError(err => {
          this.logService.errorWithData('Ошибка', err.message);
          this.loading.set(false);
          this.alertService.showSnackBar('Произошла ошибка при авторизации.');
          return of(undefined);
        })
      )
      .subscribe(success => {
        this.loading.set(false); // Выключаем состояние загрузки

        if (!success) {
          this.alertService.showSnackBar('Неверный логин или пароль.');
          return;
        }

        this.router.navigate(['/']);
        this.alertService.showSnackBar('Авторизация прошла успешно.');
      });
  }

  openResetPasswordDialog(): void {
    this.dialog.open(ResetPasswordEmailDialogComponent, {
      width: '400px',
      data: {email: ''}
    }).afterClosed().subscribe(data => {
      if (data) {
        this.emailService.sendVerificationCode(data.email).subscribe({
          next: verification => {
            this.code = verification.code;
            this.openCodeDialog(data.email);
          },
          error: () => this.alertService.showSnackBar('Ошибка при отправке кода подтверждения.')
        });
      }
    });
  }

  openCodeDialog(email: string): void {
    this.alertService.openVerificationCodeDialog(email).afterClosed().subscribe(code => {
      if (!code || this.code !== code.toString()) {
        this.alertService.showSnackBar('Неверный код!');
        return;
      }

      this.dialog.open(ResetPasswordNewPasswordDialogComponent, {
        width: '400px',
        data: {email, code, newPassword: ''}
      }).afterClosed().subscribe(result => {
        if (result && result.newPassword) {
          this.usersService.updateUserPasswordByEmail({
            email: email,
            password: result.newPassword
          }).subscribe({
            next: () => {
              this.alertService.showSnackBar('Пароль успешно изменён. Выполните вход.');
              this.authService.login(email, result.newPassword).subscribe(() => this.router.navigate(['/']));
            },
            error: () => this.alertService.showSnackBar('Ошибка при изменении пароля.')
          });
        }
      });
    });
  }
}
