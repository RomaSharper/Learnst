import { Role } from "../enums/Role";

export interface UserDao {
  openid: string,
  username: string,
  role: Role
}
