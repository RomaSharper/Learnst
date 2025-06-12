import {User} from "./User";

export interface UpdatedResponse {
  message: string | null;
  user: User | null;
  succeed: boolean;
}
