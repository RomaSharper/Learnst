import { SocialMediaPlatform } from '../enums/SocialMediaPlatform';
import { User } from './User';

export interface SocialMediaProfile {
  id: number;
  platform: SocialMediaPlatform;
  url: string;
  userId: string;
  user?: User;
}
