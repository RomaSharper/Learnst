import { User } from './User';

export interface Education {
  id: number;
  institutionName: string;
  degree: string;
  graduationYear: number;
  userId: string; // Guid
  user?: User;
}
