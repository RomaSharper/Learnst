import { TicketStatus } from "../enums/TicketStatus";
import { Ticket } from "./Ticket";

export interface StatusHistory
{
    id?: string;
    status: TicketStatus;
    changedAt?: string;
    ticketId: string;
    ticket?: Ticket;
}
