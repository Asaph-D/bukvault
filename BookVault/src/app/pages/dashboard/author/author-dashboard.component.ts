import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-author-dashboard',
  standalone: true,
  host: {
    class: 'flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden',
  },
  imports: [CommonModule, RouterModule],
  templateUrl: './author-dashboard.component.html',
  styleUrls: ['./author-dashboard.component.css'],
})
export class AuthorDashboardComponent {
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
