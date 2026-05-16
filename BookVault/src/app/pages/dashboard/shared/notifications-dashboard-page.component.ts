import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DashboardInternalHeaderComponent } from './dashboard-internal-header.component';
import { NotificationCenterComponent } from '../../../shared/notifications/notification-center.component';

export interface NotificationsPageData {
  eyebrow: string;
  title: string;
  subtitle: string;
  backLink: string;
  backLabel: string;
}

@Component({
  standalone: true,
  selector: 'app-notifications-dashboard-page',
  imports: [CommonModule, RouterModule, DashboardInternalHeaderComponent, NotificationCenterComponent],
  templateUrl: './notifications-dashboard-page.component.html',
})
export class NotificationsDashboardPageComponent {
  readonly data: NotificationsPageData;

  constructor(route: ActivatedRoute) {
    this.data = route.snapshot.data['notifPage'] as NotificationsPageData;
  }
}
