import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ValidationService } from '../../services/validation.service';

@Component({
  selector: 'app-reset-password-new-password-dialog',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
  ],
  template: `
    <h2 mat-dialog-title>Введите новый пароль</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Новый пароль</mat-label>
        <input
          matInput
          type="password"
          placeholder="Новый пароль"
          [(ngModel)]="data.newPassword"
          [formControl]="passwordControl"
        >
        @if (passwordControl.invalid && passwordControl.touched) {
          <mat-error>
            @if (passwordControl.hasError('required')) {
              Пароль обязателен.
            }
            @if (passwordControl.hasError('minlength')) {
              Пароль должен быть не менее 8 символов.
            }
            @if (passwordControl.hasError('invalidPassword')) {
              Пароль должен содержать заглавные, строчные буквы и цифры.
            }
          </mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="onCancel()">Отмена</button>
      <button mat-button [disabled]="passwordControl.invalid" [mat-dialog-close]="data">Сохранить</button>
    </mat-dialog-actions>
  `
})
export class ResetPasswordNewPasswordDialogComponent {
  passwordControl = new FormControl('', [
    Validators.required,
    Validators.minLength(8),
    ValidationService.passwordValidator
  ]);

  constructor(
    public dialogRef: MatDialogRef<ResetPasswordNewPasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { email: string, code: string, newPassword: string }
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }
}
