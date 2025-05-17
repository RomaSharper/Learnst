import {LessonType} from '../enums/LessonType';
import {Question} from './Question';
import {Topic} from './Topic';
import {UserLesson} from './UserLesson';

export interface Lesson {
  id: string; // Guid
  title: string;
  longReadUrl?: string;
  videoUrl?: string;
  questions: Question[];
  durationInMinutes: number;
  createdAt: string;
  topicId: string; // Guid
  topic?: Topic;
  userLessons: UserLesson[];
  lessonType: LessonType;
}
