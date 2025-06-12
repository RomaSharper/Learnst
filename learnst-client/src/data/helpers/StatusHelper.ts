import {Status} from '../enums/Status';

export class StatusHelper {
  static getStatusClass(status: Status): string {
    return `status-badge ${Status[status].toLowerCase()}`;
  }

  static getStatusName(status: Status): string {
    switch (status) {
      case Status.Activity:
        return 'Учится';
      case Status.Offline:
        return 'Не в сети';
      case Status.Online:
        return 'В сети';
    }
  }
}
