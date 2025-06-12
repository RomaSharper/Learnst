import {Component, inject, OnInit, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {NoDownloadingDirective} from '../../../angular/directives/no-downloading.directive';
import {MediumScreenSupport} from '../../../data/helpers/MediumScreenSupport';
import {Ticket} from '../../../data/models/Ticket';
import {TicketAnswer} from '../../../data/models/TicketAnswer';
import {RuDateTimePipe} from '../../../angular/pipes/ru.date.time.pipe';
import {AuthService} from '../../../data/services/auth.service';
import {TicketService} from '../../../data/services/tickets.service';
import {UsersService} from '../../../data/services/users.service';
import {Role} from '../../../data/enums/Role';
import {TicketStatus} from '../../../data/enums/TicketStatus';
import {TicketStatusHelper} from '../../../data/helpers/TicketStatusHelper';
import {User} from '../../../data/models/User';
import {AlertService} from '../../../data/services/alert.service';
import {AddAnswerDialogComponent} from '../../dialogs/add-answer-dialog/add-answer-dialog.component';
import {TicketTypeHelper} from '../../../data/helpers/TicketTypeHelper';
import {RoleHelper} from '../../../data/helpers/RoleHelper';
import {MatMenuModule} from '@angular/material/menu';
import {UserMenuComponent} from '../../widgets/user-menu/user-menu.component';
import {TicketType} from '../../../data/enums/TicketType';
import {forkJoin, of} from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';
import {LogService} from '../../../data/services/log.service';


@Component({
  selector: 'app-ticket',
  templateUrl: './ticket.component.html',
  styleUrls: ['./ticket.component.scss'],
  imports: [
    RouterLink,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatMenuModule,
    RuDateTimePipe,
    MatButtonModule,
    MatTooltipModule,
    UserMenuComponent,
    NoDownloadingDirective,
    MatProgressSpinnerModule
  ]
})
export class TicketComponent extends MediumScreenSupport implements OnInit {
  user!: User;
  ticket!: Ticket;
  ticketId!: string;
  loading = true;
  canChangeStatus = false;
  canAnswerOrDelete = false;
  errorMessage = signal('');
  protected readonly Role = Role;
  protected readonly RoleHelper = RoleHelper;
  protected readonly TicketType = TicketType;
  protected readonly TicketStatus = TicketStatus;
  protected readonly TicketTypeHelper = TicketTypeHelper;
  protected readonly TicketStatusHelper = TicketStatusHelper;
  private router = inject(Router);
  private logService = inject(LogService);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private alertService = inject(AlertService);
  private ticketService = inject(TicketService);

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.ticketId = params.get('ticketId')!;
        if (!this.ticketId) {
          this.handleError('Тикет не найден');
          return of(null);
        }

        return this.ticketService.getTicket(this.ticketId!).pipe(
          switchMap(ticket => {
            // Загрузка автора тикета и авторов ответов
            const author$ = this.usersService.getUserById(ticket.authorId).pipe(
              catchError(() => of({fullName: 'Неизвестный автор'} as User))
            );

            const answers$ = ticket.ticketAnswers.length > 0
              ? forkJoin(ticket.ticketAnswers.map(answer =>
                this.usersService.getUserById(answer.authorId).pipe(
                  catchError(() => of({fullName: 'Неизвестный автор'} as User))
                )))
              : of([]);

            return forkJoin([author$, answers$]).pipe(
              map(([author, authors]) => {
                ticket.author = author;
                ticket.ticketAnswers.forEach((answer, index) =>
                  answer.author = authors[index] || {fullName: 'Неизвестный автор'});
                return ticket;
              })
            );
          }),
          catchError(err => {
            this.handleError('Ошибка загрузки тикета', err);
            return of(null);
          })
        );
      }),
      switchMap(ticket => {
        if (!ticket) {
          this.loading = false;
          return of(null);
        }

        return this.authService.getUser().pipe(map(user => ({ticket, user})));
      })
    ).subscribe({
      next: result => {
        if (!result?.ticket || !result.user) {
          this.loading = false;
          return;
        }

        this.ticket = this.processTicketData(result.ticket);
        this.user = result.user;
        this.updatePermissions();
        this.loading = false;
      },
      error: err => this.handleError('Ошибка загрузки данных', err)
    });
  }

  updateStatus(newStatus: TicketStatus): void {
    this.ticketService.updateStatus(this.ticketId, newStatus).subscribe({
      next: () => {
        this.ticket.status = newStatus;
        this.ticket.statusHistories.push({
          status: newStatus,
          ticketId: this.ticketId,
          changedAt: 'Только что'
        });
        this.alertService.showSnackBar('Статус успешно обновлен');
      },
      error: () => this.alertService.showSnackBar('Ошибка при обновлении статуса')
    });
  }

  openAddAnswerDialog(): void {
    const dialogRef = this.alertService.getDialog().open(AddAnswerDialogComponent, {
      width: '500px',
      data: {
        ticketId: this.ticketId
      }
    });

    dialogRef.afterClosed().subscribe((newAnswer: TicketAnswer) => {
      newAnswer.author = this.user;
      this.ticket.ticketAnswers.push(newAnswer);
    });
  }

  deleteTicket(): void {
    this.alertService.openConfirmDialog(
      'Подтверждение',
      'Вы уверены, что хотите удалить этот тикет?'
    ).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.ticketService.deleteTicket(this.ticketId).subscribe({
        next: () => this.router.navigate(['/support']),
        error: err => this.logService.errorWithData(err)
      });
    });
  }

  private processTicketData(ticket: Ticket): Ticket {
    return {
      ...ticket,
      ticketAnswers: ticket.ticketAnswers.sort(
        (a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
      ),
      statusHistories: ticket.statusHistories.sort(
        (a, b) => new Date(a.changedAt!).getTime() - new Date(b.changedAt!).getTime()
      )
    };
  }

  private updatePermissions(): void {
    this.canChangeStatus = this.user.role !== Role.User;
    this.canAnswerOrDelete = this.canChangeStatus || this.user.id === this.ticket.authorId;
  }

  private handleError(message: string, err?: any): void {
    this.loading = false;
    this.errorMessage.set(message);
    this.logService.errorWithData(err || message);
    this.alertService.showSnackBar(message);
  }
}
