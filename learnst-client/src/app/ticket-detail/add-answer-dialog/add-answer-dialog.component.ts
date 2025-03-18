import { AlertService } from '../../../services/alert.service';
import { AuthService } from '../../../services/auth.service';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TicketService } from '../../../services/tickets.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { User } from '../../../models/User';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-add-answer-dialog',
  templateUrl: './add-answer-dialog.component.html',
  styleUrls: ['./add-answer-dialog.component.less'],
  imports: [MatDialogModule, MatFormFieldModule, MatButtonModule, MatInputModule, ReactiveFormsModule]
})
export class AddAnswerDialogComponent implements OnInit {
  user!: User;
  answerForm!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<AddAnswerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticketId: string },
    private fb: FormBuilder,
    private ticketService: TicketService,
    private authService: AuthService,
    private alertService: AlertService
  ) {
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
          this.dialogRef.close(response); // Закрыть диалог и вернуть true
        },
        error: err => {
          this.alertService.showSnackBar('Ошибка при добавлении ответа');
          console.error(err);
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(undefined);
  }
}
