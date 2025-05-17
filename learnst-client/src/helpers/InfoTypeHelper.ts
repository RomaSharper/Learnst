import {InfoType} from "../enums/InfoType";

export class InfoTypeHelper {
  static getName(infoType: InfoType): string {
    switch (infoType) {
      case InfoType.Benefit:
        return 'Почему стоит учиться';
      case InfoType.WayToLearn:
        return 'Как проходит обучение';
      default:
        return 'Неизвестно';
    }
  }

  static getInfoTypes(): { value: InfoType, label: string }[] {
    return [
      {value: InfoType.Benefit, label: 'Почему стоит учиться'},
      {value: InfoType.WayToLearn, label: 'Как проходит обучение'}
    ];
  }
}
