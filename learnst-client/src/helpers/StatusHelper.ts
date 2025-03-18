import {Status} from '../enums/Status';

export class StatusHelper {
  static getStatusClass(status: Status): string {
    return `status-badge ${status}`;
  }
}
