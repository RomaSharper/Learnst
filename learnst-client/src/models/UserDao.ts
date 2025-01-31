import { Role } from "../enums/Role";

export interface UserDao {
  userId: string,
  username: string,
  role: Role
}
