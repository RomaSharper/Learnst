import { CommonModule, Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { MediumScreenSupport } from '../../helpers/MediumScreenSupport';
import { Return } from '../../helpers/Return';
import { Ticket } from '../../models/Ticket';
import { TicketService } from '../../services/tickets.service';
import { TicketStatus } from '../../enums/TicketStatus';
import { UsersService } from '../../services/users.service';
import { CreateTicketDialogComponent } from './create-ticket-dialog/create-ticket-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RuDateTimePipe } from '../../pipes/ru.date.time.pipe';
import { MatPaginatorModule } from '@angular/material/paginator';

@Return()
@Component({
  selector: 'app-ticket-list',
  templateUrl: './ticket-list.component.html',
  styleUrls: ['./ticket-list.component.scss'],
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    RuDateTimePipe,
    MatButtonModule,
    MatTooltipModule,
    MatPaginatorModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule
  ]
})
export class TicketListComponent extends MediumScreenSupport implements OnInit {
  private dialog = inject(MatDialog);
  private usersService = inject(UsersService);
  private ticketService = inject(TicketService);

  pageSize = 5;
  pageIndex = 0;
  loading = true;
  goBack!: () => void;
  tickets: Ticket[] = [];
  pageSizeOptions = [5, 10, 20];
  paginatedTickets: Ticket[] = [];

  TicketStatus = TicketStatus;

  constructor(private router: Router, public location: Location) { super(); }

  ngOnInit(): void { this.loadTickets(); }

  onPageChange(event: any): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    const startIndex = event.pageIndex * event.pageSize;
    const endIndex = startIndex + event.pageSize;
    this.paginatedTickets = this.tickets.slice(startIndex, endIndex);
  }

  loadTickets(): void {
    this.loading = true;
    this.ticketService.getTickets().subscribe(data => {
      this.tickets = data.sort((a: Ticket, b: Ticket) =>
        new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

      this.paginatedTickets = this.tickets.slice(0, this.pageSize);

      // Загрузка авторов
      this.tickets.forEach(ticket => {
        this.usersService.getUserById(ticket.authorId).subscribe(data => ticket.author = data);
      });

      this.loading = false;
    });
  }

  openCreateTicketDialog(): void {
    const dialogRef = this.dialog.open(CreateTicketDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe((newTicket: Ticket) => {
      if (newTicket) {
        this.usersService.getUserById(newTicket.authorId).subscribe(user => {
          newTicket.author = user;
          this.tickets.unshift(newTicket);
          this.paginatedTickets = this.tickets.slice(0, this.pageSize);
        });
      }
    });
  }

  navigateToTicketDetails(ticketId: string): void {
    this.router.navigate(['/ticket', ticketId]);
  }
}
