import {Activity} from './Activity';
import {Lesson} from './Lesson';

export interface Topic {
  id?: string; // Guid
  title: string;
  lessons: Lesson[];
  activityId: string; // Guid
  activity?: Activity;
}
