import {Activity} from './Activity';
import {User} from './User';

export interface UserActivity {
  userId: string;
  user?: User;
  activityId: string;
  activity?: Activity;
  assignedAt?: string;
}
