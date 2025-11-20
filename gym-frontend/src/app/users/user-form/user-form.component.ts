// src/app/users/user-form.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, User } from '../../core/api.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
})
export class UserFormComponent implements OnInit {
  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    phone: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[0-9\-+() ]{7,20}$/),
    ]),
    email: new FormControl('', [Validators.email]),
    whatsappOptIn: new FormControl(false),
  });

  isEdit = false;
  id: string | null = null;
  saving = false;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.isEdit = true;
      // fetch the user by id for a reliable edit
      this.api.getUser(this.id).subscribe({
        next: (u) => this.form.patchValue(u),
        error: (e) => this.toastr.error('Failed to load user'),
      });
    }
  }

  get nameCtrl() {
    return this.form.get('name');
  }

  get phoneCtrl() {
    return this.form.get('phone');
  }

  get emailCtrl() {
    return this.form.get('email');
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.error('Please fix validation errors');
      return;
    }
    const payload: Partial<User> = this.form.value;
    this.saving = true;
    if (this.isEdit && this.id) {
      this.api.updateUser(this.id, payload).subscribe({
        next: () => {
          this.toastr.success('Saved');
          this.saving = false;
          this.router.navigate(['/']);
        },
        error: (e) => {
          this.toastr.error(e?.message || 'Save failed');
          this.saving = false;
        },
      });
    } else {
      this.api.createUser(payload).subscribe({
        next: () => {
          this.toastr.success('Created');
          this.saving = false;
          this.router.navigate(['/']);
        },
        error: (e) => {
          this.toastr.error(e?.message || 'Create failed');
          this.saving = false;
        },
      });
    }
  }

  cancel() {
    this.router.navigate(['/']);
  }
}
