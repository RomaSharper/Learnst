import { CommonModule, Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {Router, RouterLink} from '@angular/router';
import { MediumScreenSupport } from '../../helpers/MediumScreenSupport';
import { Return } from '../../helpers/Return';
import { Ticket } from '../../models/Ticket';
import { TicketService } from '../../services/tickets.service';
import { TicketStatus } from '../../enums/TicketStatus';
import { UsersService } from '../../services/users.service';
import { CreateTicketDialogComponent } from './create-ticket-dialog/create-ticket-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RuDateTimePipe } from '../../pipes/ru.date.time.pipe';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {NoDownloadingDirective} from '../../directives/no-downloading.directive';
import {TicketTypeHelper} from "../../helpers/TicketTypeHelper";
import {MatMenuModule} from '@angular/material/menu';
import {UserMenuComponent} from '../user-menu/user-menu.component';
import {EllipsisPipe} from '../../pipes/ellipsis.pipe';
import {TicketType} from '../../enums/TicketType';
import {TicketStatusHelper} from '../../helpers/TicketStatusHelper';
import {catchError} from 'rxjs/operators';
import {forkJoin, of} from 'rxjs';

@Return()
@Component({
  selector: 'app-ticket-list',
  templateUrl: './ticket-list.component.html',
  styleUrls: ['./ticket-list.component.scss'],
  imports: [
    EllipsisPipe,
    CommonModule,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    RuDateTimePipe,
    MatButtonModule,
    MatTooltipModule,
    UserMenuComponent,
    MatPaginatorModule,
    ReactiveFormsModule,
    NoDownloadingDirective,
    MatProgressSpinnerModule,
    RouterLink
  ]
})
export class TicketListComponent extends MediumScreenSupport implements OnInit {
  private dialog = inject(MatDialog);
  private usersService = inject(UsersService);
  private ticketService = inject(TicketService);

  goBack!: () => void;
  pageSize = 20;
  pageIndex = 0;
  loading = true;
  tickets: Ticket[] = [];
  paginatedTickets: Ticket[] = [];
  pageSizeOptions = [20, 50, 100];

  TicketStatus = TicketStatus;

  constructor(private router: Router, public location: Location) {
    super();
  }

  ngOnInit(): void {
    this.loadTickets();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    const startIndex = event.pageIndex * event.pageSize;
    const endIndex = startIndex + event.pageSize;
    this.paginatedTickets = this.tickets.slice(startIndex, endIndex);
  }

  loadTickets(): void {
    this.ticketService.getTickets().subscribe(data => {
      this.tickets = data.sort((a: Ticket, b: Ticket) =>
        new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

      // Параллельная загрузка авторов
      const authorRequests = this.tickets.map(ticket =>
        this.usersService.getUserById(ticket.authorId).pipe(
          catchError(() => of(null)) // Обработка ошибок
        )
      );

      forkJoin(authorRequests).subscribe(authors => {
        authors.forEach((author, index) => this.tickets[index].author = author!);
        this.paginatedTickets = this.tickets.slice(0, this.pageSize);
        this.loading = false;
      });
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

    protected readonly TicketTypeHelper = TicketTypeHelper;
  protected readonly TicketType = TicketType;
  protected readonly TicketStatusHelper = TicketStatusHelper;
}
