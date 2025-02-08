import { RefreshToken } from "./RefreshToken";

export interface Application {
  id?: string,
  clientId: string,
  clientSecret: string,
  name: string,
  redirectUri: string,
  allowedScopes: string[],
  createdAt: string,
  refreshTokens: RefreshToken[]
}
