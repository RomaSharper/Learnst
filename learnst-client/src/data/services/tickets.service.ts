import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {Ticket} from "../models/Ticket";
import {TicketAnswer} from "../models/TicketAnswer";
import {TicketStatus} from "../enums/TicketStatus";
import {environment} from "../../env/environment";

@Injectable({providedIn: 'root'})
export class TicketService {
  private apiUrl = `${environment.apiBaseUrl}/tickets`;

  constructor(private http: HttpClient) {
  }

  getTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.apiUrl);
  }

  getTicket(id: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${id}`);
  }

  createTicket(ticket: Ticket): Observable<Ticket> {
    return this.http.post<Ticket>(this.apiUrl, ticket);
  }

  addAnswer(answer: TicketAnswer): Observable<TicketAnswer> {
    return this.http.post<TicketAnswer>(`${this.apiUrl}/answers`, answer);
  }

  updateStatus(id: string, newStatus: TicketStatus): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/status`, newStatus);
  }

  deleteTicket(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
