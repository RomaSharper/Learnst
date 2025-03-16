import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {Observable, catchError, of, map} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IpService {
  constructor(private http: HttpClient) {}

  getIp(): Observable<string> {
    return this.http.get<any>('https://api.ipify.org?format=json').pipe(
      catchError(() => of({ ip: 'unknown' })),
      map(response => response.ip)
    );
  }
}
