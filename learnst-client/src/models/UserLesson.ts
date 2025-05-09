import { User } from './User';
import { Lesson } from './Lesson';

export interface UserLesson {
  userId: string;
  user?: User;
  lessonId: string;
  lesson?: Lesson;
}
