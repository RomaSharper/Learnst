export interface StoredUser {
  id: string;
  username: string;
  avatarUrl?: string;
  accessToken: string;
  refreshToken?: string;
  isCurrent: boolean;
  lastLogin: Date;
}
