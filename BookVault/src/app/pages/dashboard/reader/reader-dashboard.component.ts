import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-reader-dashboard',
  standalone: true,
  host: {
    class: 'flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden',
  },
  imports: [CommonModule, RouterModule],
  templateUrl: './reader-dashboard.component.html',
  styleUrls: ['./reader-dashboard.component.css'],
})
export class ReaderDashboardComponent {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  get user() {
    return this.auth.getCurrentUser();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
