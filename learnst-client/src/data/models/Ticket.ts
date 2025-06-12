import {TicketStatus} from "../enums/TicketStatus";
import {StatusHistory} from "./StatusHistory";
import {TicketAnswer} from "./TicketAnswer";
import {User} from "./User";
import {TicketType} from '../enums/TicketType';

export interface Ticket {
  id?: string;
  title: string;
  description?: string;
  status: TicketStatus;
  author?: User;
  authorId: string;
  ticketAnswers: TicketAnswer[];
  statusHistories: StatusHistory[];
  createdAt?: Date;
  type: TicketType;
}
