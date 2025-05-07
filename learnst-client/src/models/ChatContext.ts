import {NikoMood} from './NikoMood';
import {Message} from './Message';

export interface ChatContext {
  messages: Message[];
  lastTopics: string[];
  currentTopic: string;
  currentMood: NikoMood;
  moodIntensity: number;
  nextComplimentAt: number;
  complimentCounter: number;
  mentionedEntities: string[];
  userVariables: Record<string, string | number | boolean>;
  userPreferences: {
    favoriteGame?: string;
    likesCompliments?: boolean;
    name?: string;
  };
}
