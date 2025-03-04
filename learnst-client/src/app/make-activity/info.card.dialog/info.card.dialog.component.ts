import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { InfoType } from '../../../enums/InfoType';
import { InfoTypeHelper } from '../../../helpers/InfoTypeHelper';
import { AlertService } from '../../../services/alert.service';
import { FileService } from '../../../services/file.service';
import { InspectableDirective } from '../../../pipes/inspectable.pipe';

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
  infoCardForm: FormGroup;
  infoTypes = InfoTypeHelper.getInfoTypes();
  selectedFile?: File;
  previewIconUrl?: string;
  oldIconUrl?: string;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<InfoCardDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { infoCard: any },
    private fileService: FileService,
    private alertService: AlertService
  ) {
    this.infoCardForm = this.fb.group({
      text: [data.infoCard?.text || '', Validators.required],
      iconUrl: [data.infoCard?.iconUrl || '', Validators.required], // Иконка обязательна
      infoType: [data.infoCard?.infoType || InfoType.Benefit, Validators.required]
    });

    if (data.infoCard?.iconUrl) {
      this.previewIconUrl = data.infoCard.iconUrl;
      this.oldIconUrl = data.infoCard.iconUrl;
    }
  }

  // Метод для открытия файлового диалога
  openFilePicker(): void {
    const fileInput = document.getElementById('iconInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  // Метод для обработки выбора файла
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewIconUrl = e.target!.result as string; // Временное отображение новой иконки
        this.infoCardForm.patchValue({ iconUrl: 'file_selected' }); // Устанавливаем значение для валидации
      };
      reader.readAsDataURL(this.selectedFile);
    }
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

    // Если файл не выбран, просто возвращаем данные формы
    if (!this.selectedFile) {
      this.dialogRef.close(this.infoCardForm.value);
      return;
    }

    // Если файл выбран, загружаем его на сервер
    this.fileService.upload(this.selectedFile).pipe(
      catchError(err => {
        console.error('Ошибка при загрузке файла:', err);
        this.alertService.showSnackBar('Произошла ошибка при загрузке файла. Пожалуйста, попробуйте снова.');
        this.dialogRef.close();
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        // Если это редактирование и старая иконка была, удаляем её
        if (this.oldIconUrl) {
          this.fileService.delete(this.oldIconUrl).subscribe({
            next: () => console.log('Старая иконка удалена'),
            error: (err) => console.error('Ошибка при удалении старой иконки:', err)
          });
        }

        // Обновляем URL иконки в форме
        this.infoCardForm.patchValue({ iconUrl: encodeURIComponent(response.fileUrl) });
        this.dialogRef.close(this.infoCardForm.value);
      }
    });
  }
}
