import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from '../../env/environment';
import {ClientInfo} from '../models/ClientInfo';

// noinspection JSUnusedGlobalSymbols
@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = `${environment.apiBaseUrl}/client`;

  constructor(private http: HttpClient) {
  }

  getUserInfo(): Observable<ClientInfo> {
    return this.http.post<ClientInfo>(this.apiUrl, null);
  }
}
