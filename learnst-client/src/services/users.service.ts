import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { UpdatedResponse } from '../models/UpdatedResponse';
import { UpdatePasswordRequest } from '../models/UpdatePasswordRequest';
import { UpdateRoleRequest } from '../models/UpdateRoleRequest';
import { UpdateUserResponse } from '../models/UpdateUserResponse';
import { User } from '../models/User';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = `${environment.apiBaseUrl}/users`;

  constructor(private http: HttpClient) { }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`);
  }

  getUserByName(username: string): Observable<User | null> {
    return this.http.get<User | null>(`${this.apiUrl}/username/${username}`);
  }

  getUserByPhone(phone: string): Observable<User | null> {
    return this.http.get<User | null>(`${this.apiUrl}/phone/${phone}`);
  }

  getUserByEmail(email: string): Observable<User | null> {
    return this.http.get<User | null>(`${this.apiUrl}/email/${email}`);
  }

  isPremium(userId: string): Observable<{ premium: boolean }> {
    return this.http.get<{ premium: boolean }>(`${this.apiUrl}/${userId}/isPremium`);
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

  sendFriendRequest(currentUserId: string, friendId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${currentUserId}/Friendships/${friendId}`,
      {}
    ).pipe(
      catchError(error => {
        console.error('Ошибка отправки запроса:', error);
        throw error;
      })
    );
}

  acceptFriendRequest(currentUserId: string, friendId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${currentUserId}/Friendships/${friendId}/Accept`,
      {}
    );
  }

  getFollowers(userId: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/${userId}/Followers`);
  }

  getFollowersCount(userId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/${userId}/Followers/Count`);
  }

  followUser(userId: string, targetUserId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/Follow/${targetUserId}`, {});
  }

  unfollowUser(userId: string, targetUserId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${userId}/Follow/${targetUserId}`);
  }
}
