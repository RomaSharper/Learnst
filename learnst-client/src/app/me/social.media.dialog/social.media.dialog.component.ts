import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SocialMediaPlatformHelper } from '../../../helpers/SocialMediaPlatformHelper';
import { SocialMediaProfile } from '../../../models/SocialMediaProfile';
import { ValidationService } from '../../../services/validation.service';

@Component({
  selector: 'app-social-media-dialog',
  templateUrl: './social.media.dialog.component.html',
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
  ]
})
export class SocialMediaDialogComponent {
  socialMediaForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<SocialMediaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { socialMedia: SocialMediaProfile },
    private fb: FormBuilder
  ) {
    this.socialMediaForm = this.fb.group({
      url: [data.socialMedia.url, [
        Validators.required,
        Validators.maxLength(2048),
        ValidationService.urlValidator,
        ValidationService.supportedPlatformValidator
      ]]
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.socialMediaForm.invalid) {
      return;
    }
    const updatedSocialMedia = {
      ...this.data.socialMedia,
      ...this.socialMediaForm.value,
      platform: SocialMediaPlatformHelper.getSocialMediaPlatform(this.socialMediaForm.value.url)
    };
    this.dialogRef.close(updatedSocialMedia);
  }
}
