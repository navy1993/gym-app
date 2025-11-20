import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ApiService, SubscriptionPayload, User } from '../../core/api.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.css'],
})
export class SubscriptionsComponent implements OnInit {
  users: User[] = [];
  userById: { [id: string]: User } = {};
  subscriptions: any[] = [];
  loading = false;
  saving = false;

  form = new FormGroup({
    userId: new FormControl('', [Validators.required]),
    planName: new FormControl('', [Validators.required, Validators.minLength(2)]),
    startDate: new FormControl('', [Validators.required]),
    endDate: new FormControl('', [Validators.required]),
    autoRenew: new FormControl(false),
  });

  constructor(private api: ApiService, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.loadUsersAndSubscriptions();
  }

  loadUsersAndSubscriptions() {
    this.loading = true;
    this.api.getUsers().subscribe({
      next: (users) => {
        this.users = users || [];
        this.userById = {};
        this.users.forEach((u) => {
          if (u.id) this.userById[u.id] = u;
        });
        if (!this.form.value.userId && this.users.length && this.users[0].id) {
          this.form.patchValue({ userId: this.users[0].id });
        }

        this.api.getSubscriptions().subscribe({
          next: (subs) => {
            this.subscriptions = subs || [];
            this.loading = false;
          },
          error: (e) => {
            this.toastr.error(e?.message || 'Failed to load subscriptions');
            this.loading = false;
          },
        });
      },
      error: (e) => {
        this.toastr.error(e?.message || 'Failed to load users');
        this.loading = false;
      },
    });
  }

  create() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.error('User, plan, start, and end date are required');
      return;
    }
    const v = this.form.value;

    if (v.startDate && v.endDate && v.endDate < v.startDate) {
      this.toastr.error('End date must be on or after start date');
      return;
    }

    const payload: SubscriptionPayload = {
      userId: v.userId,
      planName: v.planName,
      startDate: v.startDate,
      endDate: v.endDate,
      autoRenew: !!v.autoRenew,
    };

    this.saving = true;
    this.api.createSubscription(payload).subscribe({
      next: () => {
        this.toastr.success('Subscription created');
        this.saving = false;
        this.form.patchValue({ planName: '', startDate: '', endDate: '' });
        this.loadUsersAndSubscriptions();
      },
      error: (e) => {
        this.toastr.error(e?.message || 'Failed to create subscription');
        this.saving = false;
      },
    });
  }

  getUserName(sub: any): string {
    const u = this.userById[sub.userId];
    return u ? u.name : 'Unknown';
  }

  getUserPhone(sub: any): string {
    const u = this.userById[sub.userId];
    return u?.phone || '';
  }

  daysUntilEnd(sub: any): number | null {
    if (!sub.endDate) return null;
    const end = new Date(sub.endDate);
    const today = new Date();
    const diffMs = end.getTime() - new Date(today.setHours(0, 0, 0, 0)).getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  statusLabel(sub: any): string {
    const d = this.daysUntilEnd(sub);
    if (d === null) return 'Unknown';
    if (d < 0) return 'Expired';
    if (d <= 3) return 'Expiring soon';
    return 'Active';
  }

  canWhatsapp(sub: any): boolean {
    const phone = this.getUserPhone(sub).replace(/[^0-9]/g, '');
    const d = this.daysUntilEnd(sub);
    return !!phone && d !== null && d <= 7;
  }

  whatsappUrl(sub: any): string | null {
    if (!this.canWhatsapp(sub)) return null;
    const u = this.userById[sub.userId];
    const phone = this.getUserPhone(sub).replace(/[^0-9]/g, '');
    if (!phone) return null;
    const msg = `Hi ${u?.name || ''}, your gym plan (${sub.planName}) is ending on ${sub.endDate}. Please renew to continue your workouts.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  sendWhatsapp(sub: any) {
    const url = this.whatsappUrl(sub);
    if (!url) {
      this.toastr.error('Cannot open WhatsApp for this subscription');
      return;
    }
    window.open(url, '_blank');
  }
}
