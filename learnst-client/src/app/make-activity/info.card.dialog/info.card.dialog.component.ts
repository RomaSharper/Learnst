import {Component, inject, Inject} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { InspectableDirective } from '../../../directives/inspectable.directive';
import { InfoType } from '../../../enums/InfoType';
import { InfoTypeHelper } from '../../../helpers/InfoTypeHelper';
import { AlertService } from '../../../services/alert.service';
import { FileService } from '../../../services/file.service';
import {LogService} from '../../../services/log.service';

@Component({
  selector: 'app-info-card-dialog',
  templateUrl: './info.card.dialog.component.html',
  styleUrls: ['./info.card.dialog.component.scss'],
  imports: [
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    InspectableDirective
  ]
})
export class InfoCardDialogComponent {
  oldIconUrl?: string;
  selectedFile?: File;
  infoCardForm: FormGroup;
  previewIconUrl?: string;
  infoTypes = InfoTypeHelper.getInfoTypes();

  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024;

  private fb = inject(FormBuilder);
  private logService = inject(LogService);
  private fileService = inject(FileService);
  private alertService = inject(AlertService);
  public dialogRef = inject(MatDialogRef<InfoCardDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { infoCard: any }) {
    this.infoCardForm = this.fb.group({
      text: [data.infoCard?.text || '', Validators.required],
      iconUrl: [data.infoCard?.iconUrl || '', Validators.required], // Иконка обязательна
      infoType: [data.infoCard?.infoType || InfoType.Benefit, Validators.required]
    });

    if (!data.infoCard?.iconUrl) return;
    this.previewIconUrl = data.infoCard.iconUrl;
    this.oldIconUrl = data.infoCard.iconUrl;
  }

  // Метод для открытия файлового диалога
  openFilePicker(): void {
    const fileInput = document.getElementById('iconInput') as HTMLInputElement;
    fileInput?.click();
  }

  // Метод для обработки выбора файла
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (file.size > this.MAX_FILE_SIZE) {
      this.alertService.showSnackBar('Файл слишком большой. Максимальный размер 5 МБ.');
      return;
    }

    this.selectedFile = file;
    this.readFile(file);
    this.infoCardForm.patchValue({ iconUrl: 'file_selected' }); // Устанавливаем значение для валидации
  }

  private readFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => this.previewIconUrl = e.target!.result as string;
    reader.readAsDataURL(file);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    // Проверяем, что форма валидна
    if (this.infoCardForm.invalid) {
      this.alertService.showSnackBar('Пожалуйста, заполните все обязательные поля.');
      return;
    }

    // Если это новая инфокарта и файл не выбран
    if (!this.data.infoCard && !this.selectedFile) {
      this.alertService.showSnackBar('Пожалуйста, выберите иконку.');
      return;
    }

    if (this.selectedFile?.size && this.selectedFile.size > this.MAX_FILE_SIZE) {
      this.alertService.showSnackBar('Файл слишком большой. Максимальный размер 5 МБ.');
      return;
    }

    // Если файл не выбран, просто возвращаем данные формы
    if (!this.selectedFile) {
      this.dialogRef.close(this.infoCardForm.value);
      return;
    }

    // Если файл выбран, загружаем его на сервер
    this.fileService.upload(this.selectedFile).pipe(
      catchError(err => {
        this.logService.errorWithData('Ошибка при загрузке файла:', err);
        this.alertService.showSnackBar('Произошла ошибка при загрузке файла. Пожалуйста, попробуйте снова.');
        this.dialogRef.close();
        return of(null);
      })
    ).subscribe(response => {
      if (!response) return;

      if (this.oldIconUrl)
        this.fileService.delete(this.oldIconUrl).subscribe({
          error: err => this.logService.errorWithData('Ошибка при удалении старой иконки:', err)
        });

      this.infoCardForm.patchValue({
        iconUrl: encodeURIComponent(response.fileUrl)
      });
      this.dialogRef.close(this.infoCardForm.value);
    });
  }
}
