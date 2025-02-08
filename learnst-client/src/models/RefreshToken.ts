import { Application } from "./ClientApplication";
import { User } from "./User";

export interface RefreshToken {
  token: string,
  userId: string,
  user?: User,
  clientId: string,
  client?: Application,
  expiresAt: string,
  isRevoked: boolean,
  scopes: string[]
}
