// src/app/users/users-list.component.ts
import { Component, OnInit } from '@angular/core';
import { ApiService, User } from '../../core/api.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
// import { ApiService } from 'src/app/core/api.service';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
})
export class UsersListComponent implements OnInit {
  users: User[] = [];
  loading = false;

  constructor(
    private api: ApiService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.api.getUsers().subscribe({
      next: (r) => {
        this.users = r || [];
        this.loading = false;
      },
      error: (err) => {
        this.toastr.error(err?.message || 'Failed to load users');
        this.loading = false;
      },
    });
  }

  newUser() {
    this.router.navigate(['/users/new']);
  }
  edit(u: User) {
    this.router.navigate([`/users/${u.id}/edit`]);
  }

  remove(u: User) {
    if (!confirm('Delete this user?')) return;
    this.api.deleteUser(u.id!).subscribe({
      next: () => {
        this.toastr.success('Deleted');
        this.load();
      },
      error: (e) => this.toastr.error(e?.message || 'Delete failed'),
    });
  }
}
