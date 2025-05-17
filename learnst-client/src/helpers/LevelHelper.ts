import {Level} from "../enums/Level";

export class LevelHelper {
  static getName(level: Level): string {
    switch (level) {
      case Level.Easy:
        return 'Легко';
      case Level.Medium:
        return 'Умеренно';
      case Level.Hard:
        return 'Сложно';
      default:
        return 'Неизвестно';
    }
  }

  static getLevels(): { value: Level, label: string }[] {
    return [
      {value: Level.Easy, label: 'Легко'},
      {value: Level.Medium, label: 'Умеренно'},
      {value: Level.Hard, label: 'Сложно'}
    ];
  }
}
