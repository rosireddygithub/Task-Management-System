import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionPercentage: number;
  priorityDist: { Low: number; Medium: number; High: number; };
  statusDist: { Todo: number; "In Progress": number; Done: number; };
  completedOverTime: { date: string; count: number; }[];
  totalEstimated: number;
  totalActual: number;
  averageCompletionTime: number;
  healthRatio: { overdue: number; completed: number; };
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  getAnalytics(): Observable<AnalyticsData> {
    return this.http.get<AnalyticsData>(this.apiUrl);
  }
}
