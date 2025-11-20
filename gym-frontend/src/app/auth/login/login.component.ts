import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  form = new FormGroup({
    email: new FormControl('owner@example.com', [
      Validators.required,
      Validators.email,
    ]),
    password: new FormControl('password123', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });
  loading = false;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.error('Please fix validation errors');
      return;
    }
    const v = this.form.value;
    this.loading = true;
    this.http
      .post<{ token: string; user: any }>('/api/auth/login', {
        email: v.email,
        password: v.password,
      })
      .subscribe({
        next: (res) => {
          this.auth.setToken(res.token);
          this.auth.setUser(res.user);
          this.loading = false;
          this.router.navigate(['/']);
        },
        error: (e) => {
          this.loading = false;
          const msg = e?.error?.message || e?.message || 'Login failed';
          this.toastr.error(msg);
        },
      });
  }

  get emailCtrl() {
    return this.form.get('email');
  }

  get passwordCtrl() {
    return this.form.get('password');
  }
}
