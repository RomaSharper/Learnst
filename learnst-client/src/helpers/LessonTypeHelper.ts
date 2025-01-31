import { LessonType } from "../enums/LessonType";

export class LessonTypeHelper {
  static getName(infoType: LessonType): string {
    switch (infoType) {
      case LessonType.LongRead:
        return 'Лекция';
      case LessonType.Video:
        return 'Видеоролик';
      case LessonType.Test:
      default:
        return 'Тест';
    }
  }

  static getLessonTypes(): { value: LessonType, label: string }[] {
    return [
      { value: LessonType.LongRead, label: 'Лекция' },
      { value: LessonType.Video, label: 'Видеоролик' },
      { value: LessonType.Test, label: 'Тест' }
    ];
  }
}
