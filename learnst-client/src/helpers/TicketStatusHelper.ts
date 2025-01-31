import { TicketStatus } from "../enums/TicketStatus";

export class TicketStatusHelper {
  static getName(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.Open:
        return 'Тема открыта';
      case TicketStatus.InProgress:
        return 'В процессе';
      case TicketStatus.Closed:
        return 'Темя закрыта';
    }
  }

  static getStatusIcon(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.Open:
        return 'lock_open';
      case TicketStatus.InProgress:
        return 'build';
      case TicketStatus.Closed:
        return 'lock';
      default:
        return 'help';
    }
  }
}
