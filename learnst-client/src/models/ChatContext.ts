import {NikoMood} from './NikoMood';
import {Message} from './Message';

export interface ChatContext {
  messages: Message[];
  currentMood: NikoMood;
  moodIntensity: number;
  currentTopic: string;
  complimentCounter: number;
  nextComplimentAt: number;
  lastTopics: string[];
  mentionedEntities: string[];
  userPreferences: {
    favoriteGame?: string;
    likesCompliments?: boolean;
    name?: string;
  };
}
