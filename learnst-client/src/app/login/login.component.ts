import { catchError, of } from 'rxjs';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { AlertService } from '../../services/alert.service';
import { ValidationService } from '../../services/validation.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoDownloadingDirective } from '../../directives/NoDownloadingDirective';
import { AccountsManagerComponent } from '../accounts-manager/accounts-manager.component';

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
  private router = inject(Router);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  loading = false;
  hidePassword = true;
  form = new FormGroup({
    login: new FormControl('', [Validators.required, ValidationService.loginValidator]),
    password: new FormControl('', [Validators.required])
  });

  onSubmit() {
    if (this.form.invalid) {
      this.alertService.showSnackBar('Пожалуйста, заполните все поля корректно.');
      return;
    }

    this.loading = true; // Включаем состояние загрузки
    const formValue = this.form.value;
    this.authService.login(formValue.login!, formValue.password!)
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
