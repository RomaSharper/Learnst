import { User } from './User';

export interface WorkExperience {
  id: number;
  companyName: string;
  position: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  userId: string;
  user?: User;
}
