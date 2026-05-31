import { Component } from '@angular/core';
import { DashboardMessagesComponent } from '../../shared/dashboard-messages.component';

/** @deprecated Utiliser DashboardMessagesComponent via les routes. */
@Component({
  standalone: true,
  selector: 'app-reader-messages',
  imports: [DashboardMessagesComponent],
  template: `<app-dashboard-messages />`,
})
export class ReaderMessagesComponent {}
