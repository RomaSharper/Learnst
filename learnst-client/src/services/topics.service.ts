import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Topic } from '../models/Topic';

@Injectable({
  providedIn: 'root'
})
export class TopicsService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  getTopics(activityId: string): Observable<Topic[]> {
    return this.http.get<Topic[]>(`${this.apiUrl}/activities/${activityId}/topics`);
  }

  getTopicById(topicId: string): Observable<Topic> {
    return this.http.get<Topic>(`${this.apiUrl}/topics/${topicId}`);
  }

  createTopic(topic: Topic): Observable<Topic> {
    return this.http.post<Topic>(`${this.apiUrl}/topics`, topic);
  }

  updateTopic(topicId: string, topic: Topic): Observable<Topic> {
    return this.http.put<Topic>(`${this.apiUrl}/topics/${topicId}`, topic);
  }

  deleteTopic(topicId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/topics/${topicId}`);
  }
}
