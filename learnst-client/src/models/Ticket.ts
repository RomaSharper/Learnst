import { TicketStatus } from "../enums/TicketStatus";
import { StatusHistory } from "./StatusHistory";
import { TicketAnswer } from "./TicketAnswer";
import { User } from "./User";

export interface Ticket
{
    id?: string;
    title: string;
    description?: string;
    status: TicketStatus;
    author?: User;
    authorId: string;
    ticketAnswers: TicketAnswer[];
    statusHistories: StatusHistory[];
    createdAt?: string;
}
