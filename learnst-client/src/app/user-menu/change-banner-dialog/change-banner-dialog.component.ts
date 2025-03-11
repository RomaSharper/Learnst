import { Component, inject, Inject } from "@angular/core";
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { MatFormField, MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatRadioModule } from "@angular/material/radio";
import { AlertService } from "../../../services/alert.service";

@Component({
  selector: 'app-change-banner-dialog',
  templateUrl: './change-banner-dialog.component.html',
  imports: [
    MatFormField,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    ReactiveFormsModule
  ]
})
export class ChangeBannerDialogComponent {
  form: FormGroup;

  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef<ChangeBannerDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { isPremium: boolean, banner?: string }) {
    const isBannerImage = data.banner?.startsWith('http');
    this.form = this.fb.group({
      bannerType: ['color', Validators.required], // 'color' or 'image'
      color: [data.banner || '#000000'], // Для цвета
      imageUrl: [''], // Для URL изображения
      imageFile: [null] // Для файла
    });

    if (isBannerImage)
      this.form.patchValue({ color: data.banner });
    else
      this.form.patchValue({ imageUrl: data.banner });
  }

  onColorSelected(target: EventTarget | null) {
    const color = (target as HTMLInputElement).value;
    this.form.patchValue({ color });
  }

  onFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) // Ограничение на 5 МБ
      this.form.patchValue({ imageFile: file });
    else
      this.alertService.showSnackBar('Нельзя загружать файлы больше 5 МБ!');
  }

  confirm() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
