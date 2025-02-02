import { SocialMediaPlatform } from '../enums/SocialMediaPlatform';
export class SocialMediaPlatformHelper {
  static getName(platform: SocialMediaPlatform): string {
    switch (platform) {
      case SocialMediaPlatform.Bluesky:
        return 'Bluesky';
      case SocialMediaPlatform.Discord:
        return 'Discord';
      case SocialMediaPlatform.Facebook:
        return 'Facebook';
      case SocialMediaPlatform.GitHub:
        return 'GitHub';
      case SocialMediaPlatform.Instagram:
        return 'Instagram';
      case SocialMediaPlatform.LinkedIn:
        return 'LinkedIn';
      case SocialMediaPlatform.Tumblr:
        return 'Tumblr';
      case SocialMediaPlatform.Roblox:
        return 'Roblox';
      case SocialMediaPlatform.Telegram:
        return 'Telegram';
      case SocialMediaPlatform.Twitter:
        return 'X'; // Twitter переименован в X
      case SocialMediaPlatform.VK:
        return 'VK';
      case SocialMediaPlatform.Youtube:
        return 'YouTube';
      case SocialMediaPlatform.Steam:
        return 'Steam';
      case SocialMediaPlatform.Twitch:
        return 'Twitch';
      case SocialMediaPlatform.EpicGames:
        return 'Epic Games';
      case SocialMediaPlatform.Reddit:
        return 'Reddit';
      case SocialMediaPlatform.Pinterest:
        return 'Pinterest';
      case SocialMediaPlatform.Snapchat:
        return 'Snapchat';
      case SocialMediaPlatform.TikTok:
        return 'TikTok';
      default:
        return 'unknown';
    }
  }

  static getImagePath(platform: SocialMediaPlatform): string {
    switch (platform) {
      case SocialMediaPlatform.Bluesky:
        return '/assets/icons/socials/bluesky.png';
      case SocialMediaPlatform.Discord:
        return '/assets/icons/socials/discord.png';
      case SocialMediaPlatform.Facebook:
        return '/assets/icons/socials/facebook.png';
      case SocialMediaPlatform.GitHub:
        return '/assets/icons/socials/github.png';
      case SocialMediaPlatform.Instagram:
        return '/assets/icons/socials/instagram.png';
      case SocialMediaPlatform.LinkedIn:
        return '/assets/icons/socials/linked-in.png';
      case SocialMediaPlatform.Tumblr:
        return '/assets/icons/socials/tumblr.png';
      case SocialMediaPlatform.Roblox:
        return '/assets/icons/socials/roblox.png';
      case SocialMediaPlatform.Telegram:
        return '/assets/icons/socials/telegram.png';
      case SocialMediaPlatform.Twitter:
        return '/assets/icons/socials/x.png';
      case SocialMediaPlatform.VK:
        return '/assets/icons/socials/vk.png';
      case SocialMediaPlatform.Youtube:
        return '/assets/icons/socials/youtube.png';
      case SocialMediaPlatform.Steam:
        return '/assets/icons/socials/steam.png';
      case SocialMediaPlatform.Twitch:
        return '/assets/icons/socials/twitch.png';
      case SocialMediaPlatform.EpicGames:
        return '/assets/icons/socials/epic-games.png';
      case SocialMediaPlatform.Reddit:
        return '/assets/icons/socials/reddit.png';
      case SocialMediaPlatform.Pinterest:
        return '/assets/icons/socials/pinterest.png';
      case SocialMediaPlatform.Snapchat:
        return '/assets/icons/socials/snapchat.png';
      case SocialMediaPlatform.TikTok:
        return '/assets/icons/socials/tiktok.png';
      default:
        return '/assets/icons/question.png';
    }
  }

  static getSocialMediaPlatform(url: string): SocialMediaPlatform {
    if (!url) return SocialMediaPlatform.Unknown;

    const lowerUrl = url.toLowerCase(); // Преобразуем URL в нижний регистр для удобства сравнения

    if (lowerUrl.includes('bluesky.com') || lowerUrl.includes('bsky.app')) {
      return SocialMediaPlatform.Bluesky;
    } else if (lowerUrl.includes('discord.com')) {
      return SocialMediaPlatform.Discord;
    } else if (lowerUrl.includes('facebook.com')) {
      return SocialMediaPlatform.Facebook;
    } else if (lowerUrl.includes('github.com')) {
      return SocialMediaPlatform.GitHub;
    } else if (lowerUrl.includes('instagram.com')) {
      return SocialMediaPlatform.Instagram;
    } else if (lowerUrl.includes('linkedin.com')) {
      return SocialMediaPlatform.LinkedIn;
    } else if (lowerUrl.includes('tumblr.com')) {
      return SocialMediaPlatform.Tumblr;
    } else if (lowerUrl.includes('roblox.com')) {
      return SocialMediaPlatform.Roblox;
    } else if (lowerUrl.includes('telegram.org') || lowerUrl.includes('t.me')) {
      return SocialMediaPlatform.Telegram;
    } else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
      return SocialMediaPlatform.Twitter;
    } else if (lowerUrl.includes('vk.com') || lowerUrl.includes('vk.ru')) {
      return SocialMediaPlatform.VK;
    } else if (lowerUrl.includes('youtube.com') || lowerUrl.includes('yt.be')) {
      return SocialMediaPlatform.Youtube;
    } else if (lowerUrl.includes('steamcommunity.com')) {
      return SocialMediaPlatform.Steam;
    } else if (lowerUrl.includes('twitch.tv')) {
      return SocialMediaPlatform.Twitch;
    } else if (lowerUrl.includes('epicgames.com')) {
      return SocialMediaPlatform.EpicGames;
    } else if (lowerUrl.includes('reddit.com')) {
      return SocialMediaPlatform.Reddit;
    } else if (lowerUrl.includes('pinterest.com')) {
      return SocialMediaPlatform.Pinterest;
    } else if (lowerUrl.includes('snapchat.com')) {
      return SocialMediaPlatform.Snapchat;
    } else if (lowerUrl.includes('tiktok.com')) {
      return SocialMediaPlatform.TikTok;
    }

    return SocialMediaPlatform.Unknown;
  }
}
