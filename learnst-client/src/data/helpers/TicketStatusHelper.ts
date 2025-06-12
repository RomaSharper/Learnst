import {TicketStatus} from "../enums/TicketStatus";

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

  static getStatuses(): { value: TicketStatus; label: string; icon: string }[] {
    return [
      {value: TicketStatus.Open, label: TicketStatusHelper.getName(TicketStatus.Open), icon: 'lock_open'},
      {value: TicketStatus.InProgress, label: TicketStatusHelper.getName(TicketStatus.InProgress), icon: 'build'},
      {value: TicketStatus.Closed, label: TicketStatusHelper.getName(TicketStatus.Closed), icon: 'lock'},
    ];
  }
}
