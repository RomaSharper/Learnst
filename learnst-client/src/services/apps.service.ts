import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Application } from '../models/ClientApplication';
import { ClientRegistrationRequest } from '../models/ClientRegistrationRequest';
import { ClientRegistrationResponse } from '../models/ClientRegistrationResponse';
import { UserDao } from '../models/UserDao';

@Injectable({
  providedIn: 'root'
})
export class AppsService {
  private currentUserSubject: BehaviorSubject<UserDao | null> = new BehaviorSubject<UserDao | null>(null);
  public currentUser$: Observable<UserDao | null> = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient
  ) { }

  getApplication(clientId: string): Observable<Application> {
    return this.http.get<Application>(`${environment.apiBaseUrl}/apps/${clientId}`);
  }

  getApplications(userId: string): Observable<Application[]> {
    return this.http.get<Application[]>(`${environment.apiBaseUrl}/users/${userId}/apps`);
  }

  registerApplication(clientRegistrationRequest: ClientRegistrationRequest): Observable<ClientRegistrationResponse> {
    return this.http.post<ClientRegistrationResponse>(`${environment.apiBaseUrl}/apps/create`, clientRegistrationRequest);
  }

  deleteApp(clientId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/apps/${clientId}`);
  }
}
