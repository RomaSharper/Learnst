import { ExternalLoginType } from "../enums/ExternalLoginType";

export class ExternalLoginTypeHelper {
  public static getName(type: ExternalLoginType): string {
    switch (type) {
      case ExternalLoginType.Apple:
        return 'Apple';
      case ExternalLoginType.Discord:
        return 'Discord';
      case ExternalLoginType.EpicGames:
        return 'Epic Games';
      case ExternalLoginType.Facebook:
        return 'Facebook';
      case ExternalLoginType.Github:
        return 'GitHub';
      case ExternalLoginType.Google:
        return 'Google';
      case ExternalLoginType.MailRu:
        return 'Mail.ru';
      case ExternalLoginType.Microsoft:
        return 'Microsoft';
      case ExternalLoginType.Ok:
        return 'Одноклассники';
      case ExternalLoginType.Steam:
        return 'Steam';
      case ExternalLoginType.Telegram:
        return 'Telegram';
      case ExternalLoginType.TikTok:
        return 'Tik Tok';
      case ExternalLoginType.Twitch:
        return 'Twitch';
      case ExternalLoginType.Vk:
        return 'ВКонтакте';
      case ExternalLoginType.Yandex:
        return 'Яндекс';
    }
  }
}
