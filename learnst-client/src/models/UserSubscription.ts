import { User } from "./User";

export interface UserSubscription {
    id: string;
    userId: string;
    user?: User;
    startDate: string;
    endDate: string;
    updatedAt: string;
}
