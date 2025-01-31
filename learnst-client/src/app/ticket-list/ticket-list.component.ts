import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { MediumScreenSupport } from '../../helpers/MediumScreenSupport';
import { Return } from '../../helpers/Return';
import { TicketStatusHelper } from '../../helpers/TicketStatusHelper';
import { Ticket } from '../../models/Ticket';
import { TicketService } from '../../services/tickets.service';
import { TicketStatus } from './../../enums/TicketStatus';
import { UsersService } from './../../services/users.service';
import { CreateTicketDialogComponent } from './create-ticket-dialog/create-ticket-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RuDateTimePipe } from '../../pipes/ru.date.time.pipe';

@Return()
@Component({
  selector: 'app-ticket-list',
  templateUrl: './ticket-list.component.html',
  styleUrls: ['./ticket-list.component.less'],
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    RuDateTimePipe,
    MatButtonModule,
    MatTooltipModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule
  ]
})
export class TicketListComponent extends MediumScreenSupport implements OnInit {
  loading = true;
  goBack!: () => void;
  tickets: Ticket[] = [];

  TicketStatus = TicketStatus;
  TicketStatusHelper = TicketStatusHelper;

  constructor(
    private usersService: UsersService,
    private ticketService: TicketService,
    private dialog: MatDialog,
    private router: Router,
    public location: Location
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading = true;
    this.ticketService.getTickets().subscribe(data => {
      this.tickets = data.sort((a: Ticket, b: Ticket) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()); // Сортировка по дате
      for (const ticket of this.tickets) {
        this.usersService.getUserById(ticket.authorId).subscribe(data => ticket.author = data);
      }
      this.loading = false;
    });
  }

  openCreateTicketDialog(): void {
    const dialogRef = this.dialog.open(CreateTicketDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe((newTicket: Ticket) => {
      if (newTicket) {
        this.tickets.unshift(newTicket); // Добавляем новый тикет в начало списка
      }
    });
  }

  navigateToTicketDetails(ticketId: string): void {
    this.router.navigate(['/ticket', ticketId]);
  }

  getStatusColor(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.Open:
        return 'green';
      case TicketStatus.InProgress:
        return 'blue';
      case TicketStatus.Closed:
        return 'red';
      default:
        return 'gray';
    }
  }
}
