import { Activity } from './Activity';
import { User } from './User';

export interface UserActivity {
  userId: string; // Guid
  user?: User;
  activityId: string; // Guid
  activity?: Activity;
  assignedAt: Date;
}
