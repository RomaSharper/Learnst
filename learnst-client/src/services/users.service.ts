import { HttpClient } from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { UpdatedResponse } from '../models/UpdatedResponse';
import { UpdatePasswordRequest } from '../models/UpdatePasswordRequest';
import { UpdateRoleRequest } from '../models/UpdateRoleRequest';
import { UpdateUserResponse } from '../models/UpdateUserResponse';
import { User } from '../models/User';
import {Status} from '../enums/Status';
import { UserActivityStats } from '../models/UserActivityStats';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/users`;

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`);
  }

  getUserByName(username: string): Observable<User | null> {
    return this.http.get<User | null>(`${this.apiUrl}/username/${username}`);
  }

  getUserByEmail(email: string): Observable<User | null> {
    return this.http.get<User | null>(`${this.apiUrl}/email/${email}`);
  }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  updateUser(userId: string, user: User): Observable<UpdatedResponse> {
    return this.http.put<UpdatedResponse>(`${this.apiUrl}/${userId}`, user);
  }

  updateUserRole(updateRoleRequest: UpdateRoleRequest): Observable<UpdateUserResponse> {
    return this.http.put<UpdateUserResponse>(`${this.apiUrl}/role`, updateRoleRequest);
  }

  updateUserPassword(updateRoleRequest: UpdatePasswordRequest): Observable<UpdateUserResponse> {
    return this.http.put<UpdateUserResponse>(`${this.apiUrl}/password`, updateRoleRequest);
  }

  updateUserPasswordByEmail(updateRoleRequest: { email: string, password: string }): Observable<UpdateUserResponse> {
    return this.http.put<UpdateUserResponse>(`${this.apiUrl}/password/email`, updateRoleRequest);
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}`);
  }

  checkUsernameExists(username: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/checkName`, {
      params: { username }
    });
  }

  checkEmailExists(emailAddress: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/checkEmail`, {
      params: { emailAddress }
    });
  }

  getFollowers(userId: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/${userId}/followers`);
  }

  getFollowersCount(userId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/${userId}/followers/count`);
  }

  followUser(userId: string, targetUserId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/follow/${targetUserId}`, {});
  }

  unfollowUser(userId: string, targetUserId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${userId}/follow/${targetUserId}`);
  }

  getUserStats(userId: string): Observable<UserActivityStats> {
    return this.http.get<UserActivityStats>(`${this.apiUrl}/${userId}/stats`);
  }

  getStatus(userId: string) {
    return this.http.get<Status>(`${this.apiUrl}/${userId}/status`);
  }

  updateStatus(userId: string, status: Status): Observable<any> {
    return this.http.put(`${this.apiUrl}/${userId}/status`, status);
  }
}
