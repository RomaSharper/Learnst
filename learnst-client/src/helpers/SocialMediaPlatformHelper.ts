import { SocialMediaPlatform } from '../enums/SocialMediaPlatform';

export class SocialMediaPlatformHelper {
  static getName(platform: SocialMediaPlatform): string {
    switch (platform) {
      case SocialMediaPlatform.Bluesky: return 'Bluesky';
      case SocialMediaPlatform.Discord: return 'Discord';
      case SocialMediaPlatform.Facebook: return 'Facebook';
      case SocialMediaPlatform.Github: return 'GitHub';
      case SocialMediaPlatform.Instagram: return 'Instagram';
      case SocialMediaPlatform.LinkedIn: return 'LinkedIn';
      case SocialMediaPlatform.Tumblr: return 'Tumblr';
      case SocialMediaPlatform.Roblox: return 'Roblox';
      case SocialMediaPlatform.Telegram: return 'Telegram';
      case SocialMediaPlatform.Twitter: return 'X';
      case SocialMediaPlatform.VK: return 'VK';
      case SocialMediaPlatform.Youtube: return 'YouTube';
      case SocialMediaPlatform.Steam: return 'Steam';
      case SocialMediaPlatform.Twitch: return 'Twitch';
      case SocialMediaPlatform.EpicGames: return 'Epic Games';
      case SocialMediaPlatform.Reddit: return 'Reddit';
      case SocialMediaPlatform.Pinterest: return 'Pinterest';
      case SocialMediaPlatform.Snapchat: return 'Snapchat';
      case SocialMediaPlatform.TikTok: return 'TikTok';
      case SocialMediaPlatform.Google: return 'Google';
      case SocialMediaPlatform.Microsoft: return 'Microsoft';
      case SocialMediaPlatform.Yandex: return 'Yandex';
      case SocialMediaPlatform.MailRu: return 'Mail.ru';
      case SocialMediaPlatform.Ok: return 'Одноклассники';
      case SocialMediaPlatform.Apple: return 'Apple';
      default: return 'Unknown';
    }
  }

  static getImagePath(platform: SocialMediaPlatform): string {
    const base = '/assets/icons/socials/';
    switch (platform) {
      case SocialMediaPlatform.Bluesky: return base + 'bluesky.png';
      case SocialMediaPlatform.Discord: return base + 'discord.png';
      case SocialMediaPlatform.Facebook: return base + 'facebook.png';
      case SocialMediaPlatform.Github: return base + 'github.png';
      case SocialMediaPlatform.Instagram: return base + 'instagram.png';
      case SocialMediaPlatform.LinkedIn: return base + 'linkedin.png';
      case SocialMediaPlatform.Tumblr: return base + 'tumblr.png';
      case SocialMediaPlatform.Roblox: return base + 'roblox.png';
      case SocialMediaPlatform.Telegram: return base + 'telegram.png';
      case SocialMediaPlatform.Twitter: return base + 'x.png';
      case SocialMediaPlatform.VK: return base + 'vk.png';
      case SocialMediaPlatform.Youtube: return base + 'youtube.png';
      case SocialMediaPlatform.Steam: return base + 'steam.png';
      case SocialMediaPlatform.Twitch: return base + 'twitch.png';
      case SocialMediaPlatform.EpicGames: return base + 'epic-games.png';
      case SocialMediaPlatform.Reddit: return base + 'reddit.png';
      case SocialMediaPlatform.Pinterest: return base + 'pinterest.png';
      case SocialMediaPlatform.Snapchat: return base + 'snapchat.png';
      case SocialMediaPlatform.TikTok: return base + 'tiktok.png';
      case SocialMediaPlatform.Google: return base + 'google.png';
      case SocialMediaPlatform.Microsoft: return base + 'microsoft.png';
      case SocialMediaPlatform.Yandex: return base + 'yandex.png';
      case SocialMediaPlatform.MailRu: return base + 'mail-ru.png';
      case SocialMediaPlatform.Ok: return base + 'ok.png';
      case SocialMediaPlatform.Apple: return base + 'apple.png';
      default: return '/assets/icons/question.png';
    }
  }

  static getSocialMediaPlatform(url: string): SocialMediaPlatform {
    if (!url) return SocialMediaPlatform.Unknown;

    const lowerUrl = url.toLowerCase();

    const domainPatterns = [
      { pattern: /(bluesky\.com|bsky\.app)/, platform: SocialMediaPlatform.Bluesky },
      { pattern: /discord\.(com|gg)/, platform: SocialMediaPlatform.Discord },
      { pattern: /facebook\.com/, platform: SocialMediaPlatform.Facebook },
      { pattern: /github\.com/, platform: SocialMediaPlatform.Github },
      { pattern: /instagram\.com/, platform: SocialMediaPlatform.Instagram },
      { pattern: /linkedin\.com/, platform: SocialMediaPlatform.LinkedIn },
      { pattern: /tumblr\.com/, platform: SocialMediaPlatform.Tumblr },
      { pattern: /roblox\.com/, platform: SocialMediaPlatform.Roblox },
      { pattern: /(telegram\.org|t\.me)/, platform: SocialMediaPlatform.Telegram },
      { pattern: /(twitter\.com|x\.com)/, platform: SocialMediaPlatform.Twitter },
      { pattern: /(vk\.com|vk\.ru)/, platform: SocialMediaPlatform.VK },
      { pattern: /(youtube\.com|youtu\.be)/, platform: SocialMediaPlatform.Youtube },
      { pattern: /steamcommunity\.com/, platform: SocialMediaPlatform.Steam },
      { pattern: /twitch\.tv/, platform: SocialMediaPlatform.Twitch },
      { pattern: /epicgames\.com/, platform: SocialMediaPlatform.EpicGames },
      { pattern: /reddit\.com/, platform: SocialMediaPlatform.Reddit },
      { pattern: /pinterest\.com/, platform: SocialMediaPlatform.Pinterest },
      { pattern: /snapchat\.com/, platform: SocialMediaPlatform.Snapchat },
      { pattern: /tiktok\.com/, platform: SocialMediaPlatform.TikTok },
      { pattern: /(google\.com|accounts\.google)/, platform: SocialMediaPlatform.Google },
      { pattern: /(microsoft\.com|live\.com)/, platform: SocialMediaPlatform.Microsoft },
      { pattern: /yandex\.(ru|com)/, platform: SocialMediaPlatform.Yandex },
      { pattern: /mail\.ru/, platform: SocialMediaPlatform.MailRu },
      { pattern: /ok\.ru/, platform: SocialMediaPlatform.Ok },
      { pattern: /apple\.com/, platform: SocialMediaPlatform.Apple }
    ];

    for (const { pattern, platform } of domainPatterns)
      if (pattern.test(lowerUrl)) return platform;

    return SocialMediaPlatform.Unknown;
  }
}
