import {Level} from '../enums/Level';
import {InfoCard} from './InfoCard';
import {Topic} from './Topic';
import {User} from './User';
import {UserActivity} from './UserActivity';

export interface Activity {
  isEnrolled: boolean;
  id: string; // Guid
  title: string;
  description?: string;
  avatarUrl?: string;
  createdAt: string;
  level: Level;
  authorId: string; // Guid
  author?: User;
  tags: string[];
  targetAudience: string[];
  checkList: string[];
  topics: Topic[];
  infoCards: InfoCard[];
  userActivities: UserActivity[];
  minimalScore: number;
  isClosed: boolean;
  endAt?: string;
}
