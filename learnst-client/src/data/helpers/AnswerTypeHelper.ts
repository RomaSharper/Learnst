import {AnswerType} from "../enums/AnswerType";

export class AnswerTypeHelper {
  static getName(infoType: AnswerType): string {
    switch (infoType) {
      case AnswerType.Single:
        return 'Один правильный ответ';
      case AnswerType.Multiple:
        return 'Несколько правильных ответов';
      default:
        return 'Неизвестно';
    }
  }

  static getAnswerTypes(): { value: AnswerType, label: string }[] {
    return [
      {value: AnswerType.Single, label: 'Один правильный ответ'},
      {value: AnswerType.Multiple, label: 'Несколько правильных ответов'}
    ];
  }
}
