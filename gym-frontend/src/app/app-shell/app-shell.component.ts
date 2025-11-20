// src/app/app-shell/app-shell.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-shell',
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.css'],
})
export class AppShellComponent implements OnInit, OnDestroy {
  isMobile = false;
  private bpSub?: Subscription;

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit(): void {
    // Match mobile widths under 720px
    this.bpSub = this.breakpointObserver
      .observe(['(max-width: 719px)'])
      .subscribe((result) => {
        this.isMobile = result.matches;
      });
  }

  ngOnDestroy(): void {
    this.bpSub?.unsubscribe();
  }
}
