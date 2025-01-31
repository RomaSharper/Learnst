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
      case SocialMediaPlatform.Gmail:
        return 'Gmail';
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
        return 'X';
      case SocialMediaPlatform.VK:
        return 'VK';
      case SocialMediaPlatform.Youtube:
        return 'YouTube';
    }
    return 'unknown';
  }

  static getImagePath(platform: SocialMediaPlatform): string {
    switch (platform) {
      case SocialMediaPlatform.Bluesky:
        return '/images/bluesky.png';
      case SocialMediaPlatform.Discord:
        return '/images/discord.png';
      case SocialMediaPlatform.Facebook:
        return '/images/facebook.png';
      case SocialMediaPlatform.GitHub:
        return '/images/github.png';
      case SocialMediaPlatform.Gmail:
        return '/images/gmail.png';
      case SocialMediaPlatform.Instagram:
        return '/images/instagram.png';
      case SocialMediaPlatform.LinkedIn:
        return '/images/linked-in.png';
      case SocialMediaPlatform.Tumblr:
        return '/images/tumblr.png';
      case SocialMediaPlatform.Roblox:
        return '/images/roblox.png';
      case SocialMediaPlatform.Telegram:
        return '/images/telegram.png';
      case SocialMediaPlatform.Twitter:
        return '/images/x.png';
      case SocialMediaPlatform.VK:
        return '/images/vk.png';
      case SocialMediaPlatform.Youtube:
        return '/images/youtube.png';
    }
    return '/images/question.png';
  }

  static getSocialMediaPlatform(url: string): SocialMediaPlatform {
    if (url.includes('bluesky.com') || url.includes('bsky.app'))
      return SocialMediaPlatform.Bluesky;
    else if (url.includes('discord.com'))
      return SocialMediaPlatform.Discord;
    else if (url.includes('facebook.com'))
      return SocialMediaPlatform.Facebook;
    else if (url.includes('github.com'))
      return SocialMediaPlatform.GitHub;
    else if (url.includes('gmail.com'))
      return SocialMediaPlatform.Gmail;
    else if (url.includes('instagram.com'))
      return SocialMediaPlatform.Instagram;
    else if (url.includes('linkedin.com'))
      return SocialMediaPlatform.LinkedIn;
    else if (url.includes('tumblr.com'))
      return SocialMediaPlatform.Tumblr;
    else if (url.includes('roblox.com'))
      return SocialMediaPlatform.Roblox;
    else if (url.includes('telegram.org') || url.includes('t.me'))
      return SocialMediaPlatform.Telegram;
    else if (url.includes('twitter.com') || url.includes('x.com'))
      return SocialMediaPlatform.Twitter;
    else if (url.includes('vk.com'))
      return SocialMediaPlatform.VK;
    else if (url.includes('youtube.com'))
      return SocialMediaPlatform.Youtube;
    return SocialMediaPlatform.Unknown;
  }
}
