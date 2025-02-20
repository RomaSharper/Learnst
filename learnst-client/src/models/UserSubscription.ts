import { SubscriptionType } from "../enums/SubscriptionType";
import { User } from "./User";

export interface UserSubscription {
    id: string;
    userId: string;
    user?: User;
    subscriptionType: SubscriptionType;
    startDate: string;
    endDate: string;
    updatedAt: string;
}
