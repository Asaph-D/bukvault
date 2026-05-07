import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { filter, take } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { roleDashboardSegment } from '../../guards/dashboard-role.guard';

/** Redirige `/dashboard` vers `/dashboard/{segment}/home` selon le rôle. */
@Component({
  standalone: true,
  template: '',
})
export class DashboardRedirectComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const snap = this.auth.getCurrentUser();
    if (snap) {
      const seg = roleDashboardSegment(snap.role);
      this.router.navigate(['/dashboard', seg, 'home'], { replaceUrl: true });
      return;
    }
    this.auth.currentUser$
      .pipe(
        filter((u): u is NonNullable<typeof u> => u != null),
        take(1)
      )
      .subscribe(u => {
        const seg = roleDashboardSegment(u.role);
        this.router.navigate(['/dashboard', seg, 'home'], { replaceUrl: true });
      });
  }
}
