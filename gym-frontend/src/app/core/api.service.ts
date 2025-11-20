// src/app/core/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  whatsappOptIn?: boolean;
  createdAt?: string;
}

export interface SubscriptionPayload {
  userId: string;
  planName: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  autoRenew?: boolean;
}

export interface MonthlyWorkout {
  id?: string;
  userId: string;
  month: string;
  content: any;
  pdfUrl?: string;
  sentAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  base = (window as any).__env?.API_URL || '/api';

  constructor(private http: HttpClient) {}

  // Users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/users`);
  }
  getUser(id: string) {
    return this.http.get<User>(`${this.base}/users/${id}`);
  }
  createUser(payload: Partial<User>) {
    return this.http.post<User>(`${this.base}/users`, payload);
  }
  updateUser(id: string, payload: Partial<User>) {
    return this.http.put<User>(`${this.base}/users/${id}`, payload);
  }
  deleteUser(id: string) {
    return this.http.delete<void>(`${this.base}/users/${id}`);
  }

  // Subscriptions
  createSubscription(p: SubscriptionPayload) {
    return this.http.post(`${this.base}/subscriptions`, p);
  }
  getSubscriptions() {
    return this.http.get<any[]>(`${this.base}/subscriptions`);
  }

  // Workouts
  getWorkouts(userId?: string) {
    if (userId)
      return this.http.get<MonthlyWorkout[]>(
        `${this.base}/users/${userId}/workouts`
      );
    return this.http.get<MonthlyWorkout[]>(`${this.base}/workouts`);
  }
  createWorkout(userId: string, payload: Partial<MonthlyWorkout>) {
    return this.http.post(`${this.base}/users/${userId}/workouts`, payload);
  }
}
