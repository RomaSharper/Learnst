import { Role } from './../../enums/Role';
import { TicketStatus } from './../../enums/TicketStatus';
import { TicketStatusHelper } from './../../helpers/TicketStatusHelper';
import { User } from './../../models/User';
import { AlertService } from './../../services/alert.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Ticket } from '../../models/Ticket';
import { AuthService } from '../../services/auth.service';
import { TicketService } from '../../services/tickets.service';
import { AddAnswerDialogComponent } from './add-answer-dialog/add-answer-dialog.component';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { TimeoutHandler } from '../../handlers/TimeoutHandler';
import { Return } from '../../helpers/Return';
import { MatIconModule } from '@angular/material/icon';
import { NoDownloadingDirective } from '../../directives/NoDownloadingDirective';
import { UsersService } from '../../services/users.service';
import { TicketAnswer } from '../../models/TicketAnswer';
import { PlaceholderImageDirective } from '../../directives/PlaceholderImageDirective';
import { CommonModule, Location } from '@angular/common';
import { RuDateTimePipe } from '../../pipes/ru.date.time.pipe';
import log from 'video.js/dist/types/utils/log';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MediumScreenSupport } from '../../helpers/MediumScreenSupport';

@Return()
@Component({
  selector: 'app-ticket-detail',
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.less'],
  imports: [
    RouterLink,
    CommonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    RuDateTimePipe,
    MatButtonModule,
    MatTooltipModule,
    NoDownloadingDirective,
    MatProgressSpinnerModule,
    PlaceholderImageDirective
  ]
})
export class TicketDetailComponent extends MediumScreenSupport implements OnInit {
  ticket!: Ticket;
  userId!: string;
  ticketId!: string;
  canAnswer = false;
  canDelete = false;
  goBack!: () => void;
  canChangeStatus = false;

  Role = Role;
  TicketStatus = TicketStatus;
  TicketStatusHelper = TicketStatusHelper;

  constructor(
    private router: Router,
    public location: Location,
    private route: ActivatedRoute,
    private authService: AuthService,
    private usersService: UsersService,
    private alertService: AlertService,
    private ticketService: TicketService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(paramMap => {
      this.ticketId = paramMap.get('ticketId')!;
      if (this.ticketId) {
        this.ticketService.getTicket(this.ticketId).subscribe({
          next: ticket => {
            this.ticket = ticket;
            this.ticket.ticketAnswers = this.ticket.ticketAnswers.sort(
              (a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());

            this.ticket.statusHistories = this.ticket.statusHistories.sort(
              (a, b) => new Date(a.changedAt!).getTime() - new Date(b.changedAt!).getTime());

            for (const answer of this.ticket.ticketAnswers)
              this.usersService.getUserById(answer.authorId).pipe(TimeoutHandler.retryOnCodes([500, 504])).subscribe({
                next: data => answer.author = data as User,
                error: err => {
                  this.alertService.showSnackBar('Не удалось загрузить автора ответа');
                  console.error(err);
                }
              });

            // Загружаем автора тикета
            if (ticket.authorId)
              this.usersService.getUserById(ticket.authorId).pipe(TimeoutHandler.retryOnCodes([500, 504])).subscribe({
                next: data => {
                  this.ticket.author = data as User;
                },
                error: err => {
                  this.alertService.showSnackBar('Не удалось загрузить автора тикета');
                  console.error(err);
                }
              });

            // Загружаем текущего пользователя
            this.authService.getUser().subscribe({
              next: data => {
                const currentUser = data as User;
                this.canChangeStatus = [Role.Admin, Role.Backup].includes(currentUser.role);
                this.canAnswer = this.canChangeStatus;
                this.canDelete = this.canChangeStatus || currentUser?.id === this.ticket.authorId;
              },
              error: err => {
                this.alertService.showSnackBar('Не удалось загрузить текущего пользователя');
                console.error(err);
              }
            });
          },
          error: err => {
            this.alertService.showSnackBar('Не удалось загрузить тикет');
            console.error(err);
          }
        });
      }
    });
  }

  updateStatus(newStatus: TicketStatus): void {
    this.ticketService.updateStatus(this.ticketId, newStatus).subscribe({
      next: () => {
        this.ticket.status = newStatus;
        this.ticket.statusHistories.push({
          status: newStatus,
          changedAt: new Date().toISOString(),
          ticketId: this.ticketId
        });
        this.alertService.showSnackBar('Статус успешно обновлен');
      },
      error: () => {
        this.alertService.showSnackBar('Ошибка при обновлении статуса');
      }
    });
  }

  openAddAnswerDialog(): void {
    const dialogRef = this.alertService.getDialog().open(AddAnswerDialogComponent, {
      width: '500px',
      data: { ticketId: this.ticketId }
    });

    dialogRef.afterClosed().subscribe((newAnswer: TicketAnswer) => {
      if (newAnswer)
        this.ticket.ticketAnswers.push(newAnswer);
    });
  }

  deleteTicket(): void {
    this.alertService.openConfirmDialog(
      'Подтверждение',
      'Вы уверены, что хотите удалить этот тикет?'
    ).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.ticketService.deleteTicket(this.ticketId).subscribe({
          next: () => {
            this.router.navigate(['/tickets']);
          },
          error: err => console.error(err)
        });
      }
    });
  }
}
