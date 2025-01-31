import { Answer } from './Answer';
import { User } from './User';

export interface UserAnswer {
  userId: string; // Guid
  user?: User;
  answerId: number;
  answer?: Answer;
}
