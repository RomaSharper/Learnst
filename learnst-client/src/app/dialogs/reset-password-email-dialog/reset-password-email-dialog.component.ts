import {Component, inject, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {FormControl, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {ValidationService} from '../../../data/services/validation.service';
import {UsersService} from '../../../data/services/users.service';

@Component({
  selector: 'app-reset-password-email-dialog',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
  ],
  template: `
    <h2 mat-dialog-title>Восстановление пароля</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Электронная почта</mat-label>
        <input
          matInput
          [(ngModel)]="data.email"
          placeholder="Адрес электронной почты"
          [formControl]="emailControl"
        >
        @if (emailControl.invalid && emailControl.touched) {
          <mat-error>
            @if (emailControl.hasError('required')) {
              Адрес электронной почты обязателен.
            }
            @if (emailControl.hasError('email')) {
              Некорректный формат электронной почты.
            }
            @if (emailControl.hasError('invalidDomain')) {
              Недопустимый домен.
            }
            @if (emailControl.hasError('emailNotFound')) {
              Аккаунт с такой электронной почтой не найден.
            }
          </mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-stroked-button (click)="onCancel()">Отмена</button>
      <button mat-stroked-button [disabled]="emailControl.invalid" [mat-dialog-close]="data">Далее</button>
    </mat-dialog-actions>
  `
})
export class ResetPasswordEmailDialogComponent {
  private usersService = inject(UsersService);
  emailControl = new FormControl('', {
    validators: [
      Validators.required,
      Validators.email,
      ValidationService.domainValidator
    ],
    asyncValidators: [ValidationService.existingEmailValidator(this.usersService)],
    updateOn: 'blur'
  });

  constructor(
    public dialogRef: MatDialogRef<ResetPasswordEmailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { email: string }
  ) {
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
