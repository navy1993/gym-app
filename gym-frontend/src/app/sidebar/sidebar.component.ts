import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  @Output() closeDrawer = new EventEmitter<void>();

  nav = [
    { label: 'Members', path: '/', icon: 'people' },
    { label: 'Subscriptions', path: '/subscriptions', icon: 'calendar_today' },
    { label: 'Workouts', path: '/workouts', icon: 'fitness_center' },
  ];

  constructor(private auth: AuthService, private router: Router) {}

  get userEmail(): string {
    const u = this.auth.getUser();
    return u?.email || '';
  }

  onNavClick() {
    this.closeDrawer.emit();
  }

  logout() {
    this.auth.logout();
    this.closeDrawer.emit();
    this.router.navigate(['/login']);
  }
}
