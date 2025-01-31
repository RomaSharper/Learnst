import { InfoType } from '../enums/InfoType';
import { Activity } from './Activity';

export interface InfoCard {
  id: number;
  text: string;
  iconUrl?: string;
  infoType: InfoType;
  activityId: string; // Guid
  activity?: Activity;
}
