import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NoDownloadingDirective } from '../../directives/no-downloading.directive';
import { PlaceholderImageDirective } from '../../directives/placeholder-image.directive';
import { TimeoutHandler } from '../../handlers/TimeoutHandler';
import { MediumScreenSupport } from '../../helpers/MediumScreenSupport';
import { Ticket } from '../../models/Ticket';
import { TicketAnswer } from '../../models/TicketAnswer';
import { RuDateTimePipe } from '../../pipes/ru.date.time.pipe';
import { AuthService } from '../../services/auth.service';
import { TicketService } from '../../services/tickets.service';
import { UsersService } from '../../services/users.service';
import { Role } from './../../enums/Role';
import { TicketStatus } from './../../enums/TicketStatus';
import { TicketStatusHelper } from './../../helpers/TicketStatusHelper';
import { User } from './../../models/User';
import { AlertService } from './../../services/alert.service';
import { AddAnswerDialogComponent } from './add-answer-dialog/add-answer-dialog.component';

@Component({
  selector: 'app-ticket-detail',
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.scss'],
  imports: [
    RouterLink,
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
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private alertService = inject(AlertService);
  private ticketService = inject(TicketService);

  user!: User;
  ticket!: Ticket;
  ticketId!: string;
  canAnswer = false;
  canChangeStatus = false;
  errorMessage = signal('');
  canAnswerOrDelete = false;

  Role = Role;
  TicketStatus = TicketStatus;
  TicketStatusHelper = TicketStatusHelper;

  ngOnInit(): void {
    this.route.paramMap.subscribe(paramMap => {
      this.ticketId = paramMap.get('ticketId')!;
      if (!this.ticketId) return;
      this.ticketService.getTicket(this.ticketId).subscribe({
        next: ticket => {
          this.ticket = ticket;

          this.authService.getUser().subscribe({
            next: data => {
              this.user = data as User;
              this.canChangeStatus = this.user.role !== Role.User;
              this.canAnswerOrDelete = this.canChangeStatus || this.user.id === this.ticket.authorId;
            }
          })

          // Загружаем текущего пользователя
          this.usersService.getUserById(ticket.authorId).subscribe({
            next: data => {
              const currentUser = data as User;
              this.ticket.author = currentUser;

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
            },
            error: err => {
              this.alertService.showSnackBar('Не удалось загрузить текущего пользователя');
              console.error(err);
            }
          });
        },
        error: err => {
          this.errorMessage.set('Не удалось загрузить тикет');
          console.error(err);
        }
      });
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
        error: err => console.error(err)
      });
    });
  }
}
