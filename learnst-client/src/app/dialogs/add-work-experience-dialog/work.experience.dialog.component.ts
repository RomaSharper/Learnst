import {Component, Inject} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatNativeDateModule} from '@angular/material/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MediumScreenSupport} from '../../../data/helpers/MediumScreenSupport';
import {Return} from '../../../data/helpers/Return';
import {WorkExperience} from '../../../data/models/WorkExperience';
import {DateService} from '../../../data/services/date.service';
import {Router} from '@angular/router';
import {Location} from '@angular/common';

@Return()
@Component({
  selector: 'app-work-experience-dialog',
  templateUrl: './work.experience.dialog.component.html',
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatDatepickerModule,
  ]
})
export class WorkExperienceDialogComponent extends MediumScreenSupport {
  workExperienceForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<WorkExperienceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { workExperience: WorkExperience },
    private fb: FormBuilder,
    public location: Location,
    public router: Router
  ) {
    super();
    this.workExperienceForm = this.fb.group({
      companyName: [data.workExperience.companyName, [Validators.required, Validators.maxLength(100)]],
      position: [data.workExperience.position, [Validators.required, Validators.maxLength(100)]],
      startDate: [data.workExperience.startDate, Validators.required],
      endDate: [data.workExperience.endDate],
      description: [data.workExperience.description, Validators.maxLength(500)]
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.workExperienceForm.invalid) return;
    const updatedWorkExperience = {
      ...this.data.workExperience,
      ...this.workExperienceForm.value,
      startDate: DateService.formatDate(this.workExperienceForm.value.startDate),
      endDate: DateService.formatDate(this.workExperienceForm.value.endDate)
    };
    this.dialogRef.close(updatedWorkExperience);
  }
}
