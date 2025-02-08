import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { AppsService } from '../../../services/apps.service';
import { AlertService } from './../../../services/alert.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-apps-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.less'],
  imports: [MatInputModule, MatButtonModule, ReactiveFormsModule]
})
export class CreateClientComponent {
  success = false;
  userId!: string;
  submitted = false;
  registerGroup: FormGroup;

  constructor(
    private appsService: AppsService,
    private authService: AuthService,
    private alertService: AlertService
  ) {
    this.registerGroup = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      redirectUri: new FormControl('', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]),
      allowedScopes: new FormControl('', [Validators.required, Validators.maxLength(100)])
    });

    this.authService.getUser().subscribe({
      next: user => {
        if (user && user.id)
          this.userId = user.id;
        else
          this.alertService.showSnackBar('Пользователь не авторизован');
        console.log('Пользователь:', user?.id);

      },
      error: error => {
        this.alertService.showSnackBar('Ошибка при получении данных пользователя');
        console.error('Ошибка при получении данных пользователя:', error);
      }
    });
  }

  get f() {
    return this.registerGroup.controls;
  }

  onSubmit() {
    this.submitted = true;
    if (this.registerGroup.invalid) {
      return;
    }

    if (!this.userId) {
      this.alertService.showSnackBar('Пользователь не авторизован');
      return;
    }

    const applicationData = {
      ...this.registerGroup.value,
      userId: this.userId,
      allowedScopes: this.registerGroup.value.allowedScopes.split(' ')
    };
    console.log(applicationData);

    this.appsService.registerApplication(applicationData).subscribe({
      next: response => {
        this.success = true;
        this.alertService.showSnackBar('Приложение зарегистрировано успешно!');
        console.log('Приложение зарегистрировано успешно:', response);
      },
      error: error => {
        const message = error?.error?.message || 'Произошла ошибка при регистрации';
        this.alertService.showSnackBar(message);
        console.error('Произошла ошибка при регистрации:', error);
      }
    });
  }
}
