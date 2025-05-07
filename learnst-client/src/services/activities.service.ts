import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Activity } from '../models/Activity';
import { UserActivity } from '../models/UserActivity';

@Injectable({
  providedIn: 'root'
})
export class ActivitiesService {
  private http = inject(HttpClient);

  getActivities(): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${environment.apiBaseUrl}/activities`);
  }

  getActivityById(activityId: string): Observable<Activity> {
    return this.http.get<Activity>(`${environment.apiBaseUrl}/activities/${activityId}`);
  }

  createActivity(activity: Activity): Observable<Activity> {
    return this.http.post<Activity>(`${environment.apiBaseUrl}/activities`, activity);
  }

  updateActivity(activityId: string, activity: Activity): Observable<Activity> {
    return this.http.put<Activity>(`${environment.apiBaseUrl}/activities/${activityId}`, activity);
  }

  deleteActivity(activityId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/activities/${activityId}`);
  }

  // User Activites

  getUserActivities(userId: string): Observable<UserActivity[]> {
    return this.http.get<UserActivity[]>(`${environment.apiBaseUrl}/userActivities/${userId}`);
  }

  isUserActivityExists(userId: string, activityId: string): Observable<boolean>  {
    return this.http.get<boolean>(`${environment.apiBaseUrl}/userActivities/checkUserActivity/${userId}/${activityId}`);
  }

  createUserActivity(userActivity: UserActivity): Observable<UserActivity>  {
    return this.http.post<UserActivity>(`${environment.apiBaseUrl}/userActivities`, userActivity);
  }

  deleteUserActivity(userId: string, activityId: string) {
    return this.http.delete<void>(`${environment.apiBaseUrl}/userActivities/${userId}/${activityId}`);
  }
}
