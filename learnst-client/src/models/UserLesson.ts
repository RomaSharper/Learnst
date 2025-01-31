import { User } from './User';
import { Lesson } from './Lesson';

export interface UserLesson {
  userId: string; // Guid
  user?: User;
  lessonId: string; // Guid
  lesson?: Lesson;
}
