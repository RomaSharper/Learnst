import {Component, inject, Inject, OnInit} from "@angular/core";
import {FormGroup, FormBuilder, Validators, ReactiveFormsModule} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatDialogRef, MAT_DIALOG_DATA, MatDialogModule} from "@angular/material/dialog";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInputModule} from "@angular/material/input";
import {MatRadioModule} from "@angular/material/radio";
import {AlertService} from "../../../services/alert.service";
import {FileService} from "../../../services/file.service";
import {lastValueFrom} from "rxjs";
import {MediumScreenSupport} from '../../../helpers/MediumScreenSupport';
import {NoDownloadingDirective} from '../../../directives/no-downloading.directive';
import {LogService} from '../../../services/log.service';

@Component({
  selector: 'app-change-banner-dialog',
  templateUrl: './change-banner-dialog.component.html',
  styleUrls: ['./change-banner-dialog.component.scss'],
  imports: [
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    NoDownloadingDirective
  ]
})
export class ChangeBannerDialogComponent extends MediumScreenSupport implements OnInit {
  private currentFile: File | null = null;
  private fb = inject(FormBuilder);
  private logService = inject(LogService);
  private fileService = inject(FileService);
  private alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef<ChangeBannerDialogComponent>);

  form: FormGroup;
  previewUrl: string | null = null;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { banner?: string }) {
    super();
    const bannerIsColor = data.banner?.startsWith('#');
    this.previewUrl = data.banner || null;

    this.form = this.fb.group({
      imageFile: [null, Validators.required],
      bannerType: [bannerIsColor ? 'color' : 'image', Validators.required],
      color: [bannerIsColor ? data.banner || '#ffffff' : '#ffffff', Validators.required]
    });
  }

  ngOnInit() {
    this.form.get('bannerType')?.valueChanges.subscribe(value => {
      if (value === 'color') {
        this.form.get('color')?.setValidators(Validators.required);
        this.form.get('imageFile')?.clearValidators();
        this.previewUrl = null;
      } else {
        this.form.get('color')?.clearValidators();
        this.form.get('imageFile')?.setValidators(Validators.required);
        this.previewUrl = this.data.banner || null;
      }
      this.form.get('color')?.updateValueAndValidity();
      this.form.get('imageFile')?.updateValueAndValidity();
    });
  }

  onColorSelected(target: EventTarget | null) {
    const color = (target as HTMLInputElement).value;
    this.form.patchValue({color});
    this.previewUrl = color;
  }

  onFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.alertService.showSnackBar('Нельзя загружать файлы больше 5 МБ!');
      fileInput.value = '';
      return;
    }

    this.currentFile = file;
    this.previewUrl = URL.createObjectURL(file);
    this.form.patchValue({imageFile: file});
  }

  async confirm() {
    if (this.form.invalid) return;

    const formValue = this.form.value;
    let resultBanner = '';

    try {
      // Удаление старого изображения в двух случаях:
      // 1. Переключение на цвет и был изображение
      // 2. Загрузка нового изображения поверх старого
      const oldBannerIsImage = this.data.banner && !this.data.banner.startsWith('#');

      if (formValue.bannerType === 'color' && oldBannerIsImage
        || formValue.bannerType === 'image' && this.currentFile && oldBannerIsImage)
        await lastValueFrom(this.fileService.delete(this.data.banner!));

      // Обработка нового контента
      if (formValue.bannerType === 'image' && this.currentFile) {
        const uploadResponse = await lastValueFrom(this.fileService.upload(this.currentFile));
        resultBanner = uploadResponse.fileUrl;
      } else
        resultBanner = formValue.color;

      this.dialogRef.close(resultBanner);
    } catch (error) {
      this.alertService.showSnackBar('Ошибка при обновлении баннера');
      if (error instanceof Error)
        this.logService.error(error);
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
