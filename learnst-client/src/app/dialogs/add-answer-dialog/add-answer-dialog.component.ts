import {AlertService} from '../../../data/services/alert.service';
import {AuthService} from '../../../data/services/auth.service';
import {Component, inject, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {TicketService} from '../../../data/services/tickets.service';
import {MatFormFieldModule} from '@angular/material/form-field';
import {User} from '../../../data/models/User';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {LogService} from '../../../data/services/log.service';

@Component({
  selector: 'app-add-answer-dialog',
  templateUrl: './add-answer-dialog.component.html',
  imports: [MatDialogModule, MatFormFieldModule, MatButtonModule, MatInputModule, ReactiveFormsModule]
})
export class AddAnswerDialogComponent implements OnInit {
  user!: User;
  answerForm!: FormGroup;
  public dialogRef = inject(MatDialogRef<AddAnswerDialogComponent>);
  private fb = inject(FormBuilder);
  private logService = inject(LogService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private ticketService = inject(TicketService);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { ticketId: string }) {
  }

  ngOnInit(): void {
    this.answerForm = this.fb.group({
      content: ['', Validators.required]
    });
    this.authService.getUser().subscribe(data => this.user = data!);
  }

  onSubmit(): void {
    if (this.answerForm.valid) {
      this.ticketService.addAnswer({
        authorId: this.user.id!,
        ticketId: this.data.ticketId,
        content: this.answerForm.value.content,
      }).subscribe({
        next: response => {
          this.alertService.showSnackBar('Ответ успешно добавлен');
          this.dialogRef.close(response);
        },
        error: err => {
          this.alertService.showSnackBar('Ошибка при добавлении ответа');
          this.logService.error(err);
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(undefined);
  }
}
