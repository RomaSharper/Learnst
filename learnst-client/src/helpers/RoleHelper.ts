import { Role } from '../enums/Role';

export class RoleHelper {
  static getName(role: Role): string {
    switch (role) {
      case Role.Backup:
        return 'Поддержка';
      case Role.Specialist:
        return 'Специалист';
      case Role.Admin:
        return 'Администратор';
      default:
        return 'Пользователь';
    }
  }
}
