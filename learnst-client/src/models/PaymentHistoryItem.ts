import { PaymentStatus } from "./PaymentStatus";

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  date: string;
  status: PaymentStatus;
}
