import { catchError, of } from 'rxjs';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { AlertService } from '../../services/alert.service';
import { ValidationService } from '../../services/validation.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less'],
  imports: [
    RouterLink,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule
  ]
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  hidePassword = true;

  constructor(
    private router: Router,
    private authService: AuthService,
    private alertService: AlertService
  ) {
    this.form = new FormGroup({
      username: new FormControl('', [Validators.required, ValidationService.usernameValidator]),
      password: new FormControl('', [Validators.required])
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.alertService.showSnackBar('Пожалуйста, заполните все поля корректно.');
      return;
    }

    this.loading = true; // Включаем состояние загрузки

    const formValue = this.form.value;

    this.authService.login(formValue.username, formValue.password)
      .pipe(
        catchError(error => {
          console.error('Ошибка', error.message);
          this.loading = false; // Выключаем состояние загрузки при ошибке
          this.alertService.showSnackBar('Произошла ошибка при авторизации.');
          return of(undefined);
        })
      )
      .subscribe(success => {
        this.loading = false; // Выключаем состояние загрузки

        if (!success) {
          this.alertService.showSnackBar('Неверный логин или пароль.');
          return;
        }

        this.router.navigate(['/']);
        this.alertService.showSnackBar('Авторизация прошла успешно.');
      });
  }
}
