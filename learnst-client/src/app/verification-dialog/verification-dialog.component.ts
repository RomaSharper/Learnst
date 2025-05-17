import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-verification-dialog',
  templateUrl: './verification-dialog.component.html',
  imports: [MatInputModule, MatDialogModule, MatButtonModule, MatFormFieldModule, ReactiveFormsModule]
})
export class VerificationDialogComponent {
  form: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<VerificationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: { email: string }
  ) {
    this.form = new FormGroup({
      code: new FormControl('', [
        Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^\d+$/)
      ])
    });
  }

  confirm() {
    if (this.form.valid)
      this.dialogRef.close(this.form.value.code);
  }

  close() {
    this.dialogRef.close(0);
  }
}
