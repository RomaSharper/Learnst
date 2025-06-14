import {CommonModule, Location} from '@angular/common';
import {Component, inject, OnInit} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {Router, RouterLink} from '@angular/router';
import {MediumScreenSupport} from '../../../data/helpers/MediumScreenSupport';
import {Return} from '../../../data/helpers/Return';
import {Ticket} from '../../../data/models/Ticket';
import {TicketService} from '../../../data/services/tickets.service';
import {TicketStatus} from '../../../data/enums/TicketStatus';
import {UsersService} from '../../../data/services/users.service';
import {CreateTicketDialogComponent} from '../../dialogs/create-ticket-dialog/create-ticket-dialog.component';
import {MatTooltipModule} from '@angular/material/tooltip';
import {RuDateTimePipe} from '../../../angular/pipes/ru.date.time.pipe';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {NoDownloadingDirective} from '../../../angular/directives/no-downloading.directive';
import {TicketTypeHelper} from "../../../data/helpers/TicketTypeHelper";
import {MatMenuModule} from '@angular/material/menu';
import {UserMenuComponent} from '../../widgets/user-menu/user-menu.component';
import {EllipsisPipe} from '../../../angular/pipes/ellipsis.pipe';
import {TicketType} from '../../../data/enums/TicketType';
import {TicketStatusHelper} from '../../../data/helpers/TicketStatusHelper';
import {catchError} from 'rxjs/operators';
import {forkJoin, of} from 'rxjs';
import {LogService} from '../../../data/services/log.service';

@Return()
@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
  imports: [
    RouterLink,
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
    MatProgressSpinnerModule
  ]
})
export class SupportComponent extends MediumScreenSupport implements OnInit {
  goBack!: () => void;
  pageSize = 20;
  pageIndex = 0;
  loading = true;
  tickets: Ticket[] = [];
  paginatedTickets: Ticket[] = [];
  pageSizeOptions = [20, 50, 100];
  protected readonly TicketType = TicketType;
  protected readonly TicketStatus = TicketStatus;
  protected readonly TicketTypeHelper = TicketTypeHelper;
  protected readonly TicketStatusHelper = TicketStatusHelper;
  private dialog = inject(MatDialog);
  private logService = inject(LogService);
  private usersService = inject(UsersService);
  private ticketService = inject(TicketService);

  constructor(private router: Router, public location: Location) {
    super();
  }

  ngOnInit(): void {
    this.loadTickets();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    const startIndex = event.pageIndex * event.pageSize;
    const endIndex = startIndex + event.pageSize;
    this.paginatedTickets = this.tickets.slice(startIndex, endIndex);
  }

  loadTickets(): void {
    this.ticketService.getTickets().pipe(
      catchError(error => {
        this.logService.errorWithData('Error loading tickets:', error);
        this.loading = false; // Гарантированно выключаем загрузку
        return of([]); // Продолжаем цепочку с пустым массивом
      })
    ).subscribe({
      next: data => {
        this.tickets = data.sort(
          (a: Ticket, b: Ticket) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
        );

        // Если нет тикетов - сразу завершаем загрузку
        if (!this.tickets.length) {
          this.loading = false;
          this.paginatedTickets = [];
          return;
        }

        const authorRequests = this.tickets.map(ticket =>
          this.usersService.getUserById(ticket.authorId).pipe(catchError(() => of(null)))
        );

        forkJoin(authorRequests).subscribe({
          next: authors => {
            authors.forEach((author, index) =>
              this.tickets[index].author = author || undefined
            );
            this.paginatedTickets = this.tickets.slice(0, this.pageSize);
            this.loading = false;
          },
          error: error => {
            this.logService.errorWithData('Ошибка при загрузке авторов:', error);
            this.loading = false; // Гарантированно выключаем загрузку
          }
        });
      },
      error: error => {
        this.logService.error(error);
        this.loading = false;
      }
    });
  }

  openCreateTicketDialog(): void {
    const dialogRef = this.dialog.open(CreateTicketDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe((newTicket: Ticket) => {
      if (newTicket)
        this.usersService.getUserById(newTicket.authorId).subscribe(user => {
          newTicket.author = user;
          this.tickets.unshift(newTicket);
          this.paginatedTickets = this.tickets.slice(0, this.pageSize);
        });
    });
  }

  navigateToTicketDetails(ticketId: string): void {
    this.router.navigate(['/ticket', ticketId]);
  }
}
