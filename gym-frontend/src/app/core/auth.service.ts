// src/app/core/auth.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'gym_token';
  private userKey = 'gym_user'; // optional: store simple user identity

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
  removeToken() {
    localStorage.removeItem(this.tokenKey);
  }

  setUser(u: any) {
    localStorage.setItem(this.userKey, JSON.stringify(u));
  }
  getUser() {
    const s = localStorage.getItem(this.userKey);
    return s ? JSON.parse(s) : null;
  }
  logout() {
    this.removeToken();
    localStorage.removeItem(this.userKey);
    // optionally redirect — leave to caller
  }

  // helper - whether user is "logged in"
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
