import { Role } from "../enums/Role";

export interface UpdateRoleRequest {
  role: Role
  userId: string
  adminId: string
}
