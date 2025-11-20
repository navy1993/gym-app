import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ApiService, MonthlyWorkout, User } from '../../core/api.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-workouts',
  templateUrl: './workouts.component.html',
  styleUrls: ['./workouts.component.css'],
})
export class WorkoutsComponent implements OnInit {
  users: User[] = [];
  userById: { [id: string]: User } = {};
  selectedUserId: string | null = null;
  workouts: MonthlyWorkout[] = [];
  loading = false;
  saving = false;

  form = new FormGroup({
    month: new FormControl('', [Validators.required]),
    content: new FormControl('', [Validators.required, Validators.minLength(10)]),
  });

  constructor(private api: ApiService, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.api.getUsers().subscribe({
      next: (users) => {
        this.users = users || [];
        this.userById = {};
        this.users.forEach((u) => {
          if (u.id) this.userById[u.id] = u;
        });
        if (this.users.length && this.users[0].id) {
          this.selectedUserId = this.users[0].id;
          this.loadWorkoutsFor(this.selectedUserId);
        } else {
          this.loading = false;
        }
      },
      error: (e) => {
        this.toastr.error(e?.message || 'Failed to load users');
        this.loading = false;
      },
    });
  }

  onUserChange(id: string) {
    this.selectedUserId = id;
    this.loadWorkoutsFor(id);
  }

  loadWorkoutsFor(userId: string) {
    this.loading = true;
    this.api.getWorkouts(userId).subscribe({
      next: (ws) => {
        this.workouts = ws || [];
        this.loading = false;
      },
      error: (e) => {
        this.toastr.error(e?.message || 'Failed to load workouts');
        this.loading = false;
      },
    });
  }

  createWorkout() {
    if (!this.selectedUserId) {
      this.toastr.error('Select a member first');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.error('Month and workout plan are required');
      return;
    }
    const v = this.form.value;

    const payload: Partial<MonthlyWorkout> = {
      month: v.month,
      content: v.content,
    };

    this.saving = true;
    this.api.createWorkout(this.selectedUserId, payload).subscribe({
      next: () => {
        this.toastr.success('Workout plan saved');
        this.saving = false;
        this.form.patchValue({ content: '' });
        this.loadWorkoutsFor(this.selectedUserId!);
      },
      error: (e) => {
        this.toastr.error(e?.message || 'Failed to save workout');
        this.saving = false;
      },
    });
  }

  whatsappUrl(w: MonthlyWorkout): string | null {
    const u = this.userById[w.userId];
    const phone = u?.phone?.replace(/[^0-9]/g, '');
    if (!u || !phone) return null;
    const msg = `Hi ${u.name}, here is your workout plan for ${w.month}:\n\n${w.content}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  sendWhatsapp(w: MonthlyWorkout) {
    const url = this.whatsappUrl(w);
    if (!url) {
      this.toastr.error('Cannot open WhatsApp for this workout');
      return;
    }
    window.open(url, '_blank');
  }
}
