import { AlertService } from './../../../services/alert.service';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TicketService } from '../../../services/tickets.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../../../services/auth.service';
import { Ticket } from '../../../models/Ticket';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { TicketStatus } from '../../../enums/TicketStatus';

@Component({
  selector: 'app-create-ticket-dialog',
  templateUrl: './create-ticket-dialog.component.html',
  styleUrls: ['./create-ticket-dialog.component.less'],
  imports: [ReactiveFormsModule, MatDialogModule, MatInputModule, MatFormFieldModule, MatButtonModule]
})
export class CreateTicketDialogComponent implements OnInit {
  userId!: string;
  ticketForm!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<CreateTicketDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private ticketService: TicketService,
    private alertService: AlertService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.ticketForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(500)]]
    });
    this.authService.getUser().subscribe(data => this.userId = data?.id!);
  }

  onSubmit(): void {
    if (this.ticketForm.valid) {
      const newTicket: Ticket = {
        ticketAnswers: [],
        statusHistories: [],
        authorId: this.userId,
        createdAt: new Date(),
        status: TicketStatus.Open,
        title: this.ticketForm.value.title,
        description: this.ticketForm.value.description,
      };

      this.ticketService.createTicket(newTicket).subscribe({
        next: (createdTicket) => {
          this.alertService.showSnackBar('Тикет успешно создан');
          this.dialogRef.close({
            ...createdTicket,
            createdAt: 'Только что'
          }); // Возвращаем созданный тикет
        },
        error: () => {
          this.alertService.showSnackBar('Ошибка при создании тикета');
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
