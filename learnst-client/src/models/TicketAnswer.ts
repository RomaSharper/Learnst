import { Ticket } from "./Ticket";
import { User } from "./User";

export interface TicketAnswer
{
    id?: string;
    content: string;
    ticketId: string;
    ticket?: Ticket;
    authorId: string;
    author?: User;
    createdAt?: string;
}
