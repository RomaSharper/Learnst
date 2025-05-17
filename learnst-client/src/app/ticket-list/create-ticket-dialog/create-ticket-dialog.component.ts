import {AlertService} from '../../../services/alert.service';
import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {TicketService} from '../../../services/tickets.service';
import {MatFormFieldModule} from '@angular/material/form-field';
import {AuthService} from '../../../services/auth.service';
import {Ticket} from '../../../models/Ticket';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {TicketStatus} from '../../../enums/TicketStatus';
import {TicketType} from '../../../enums/TicketType';
import {MatSelectModule} from '@angular/material/select';
import {TicketTypeHelper} from '../../../helpers/TicketTypeHelper';

@Component({
  selector: 'app-create-ticket-dialog',
  templateUrl: './create-ticket-dialog.component.html',
  styleUrls: ['./create-ticket-dialog.component.scss'],
  imports: [ReactiveFormsModule, MatDialogModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatSelectModule]
})
export class CreateTicketDialogComponent implements OnInit {
  userId!: string;
  ticketForm!: FormGroup;
  ticketTypes = [
    TicketType.General,
    TicketType.Feature,
    TicketType.Help,
    TicketType.Request,
    TicketType.Maintenance
  ];
  selectedType = this.ticketTypes[0];
  protected readonly TicketTypeHelper = TicketTypeHelper;

  constructor(
    public dialogRef: MatDialogRef<CreateTicketDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private ticketService: TicketService,
    private alertService: AlertService,
    private authService: AuthService
  ) {
  }

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
        createdAt: new Date(),
        authorId: this.userId,
        type: this.selectedType,
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
