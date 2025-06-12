import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {Education} from '../../../data/models/Education';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-education-dialog',
  templateUrl: './education.dialog.component.html',
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
  ]
})
export class EducationDialogComponent {
  educationForm: FormGroup;
  currentYear = new Date().getFullYear();

  constructor(
    public dialogRef: MatDialogRef<EducationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { education: Education },
    private fb: FormBuilder
  ) {
    this.educationForm = this.fb.group({
      institutionName: [data.education.institutionName, [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      degree: [data.education.degree, [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      graduationYear: [data.education.graduationYear, [Validators.required, Validators.min(1900), Validators.max(this.currentYear)]]
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.educationForm.invalid) return;
    const updatedEducation = {...this.data.education, ...this.educationForm.value};
    this.dialogRef.close(updatedEducation);
  }
}
