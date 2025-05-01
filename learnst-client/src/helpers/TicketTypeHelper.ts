import {TicketType} from "../enums/TicketType";

export class TicketTypeHelper {
  static getName(type: TicketType): string {
    switch (type) {
      case TicketType.General: return 'Общий';
      case TicketType.Feature: return 'Фича';
      case TicketType.Help: return 'Помощь';
      case TicketType.Request: return 'Запрос';
      case TicketType.Maintenance: return 'Обслуживание';
      default: return 'Неизвестно';
    }
  }

  static getColor(type: TicketType): string {
    switch (type) {
      case TicketType.General: return '#808080';
      case TicketType.Feature: return '#4CAF50';
      case TicketType.Help: return '#2196F3';
      case TicketType.Request: return '#FFEB3B';
      case TicketType.Maintenance: return '#F44336';
      default: return '#000000';
    }
  }

  static getTypes(): { value: TicketType, label: string }[] {
    return [
      { value: TicketType.General, label: TicketTypeHelper.getName(TicketType.General) },
      { value: TicketType.Feature, label: TicketTypeHelper.getName(TicketType.Feature) },
      { value: TicketType.Help, label: TicketTypeHelper.getName(TicketType.Help) },
      { value: TicketType.Request, label: TicketTypeHelper.getName(TicketType.Request) },
      { value: TicketType.Maintenance, label: TicketTypeHelper.getName(TicketType.Maintenance) }
    ];
  }
}
