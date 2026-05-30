import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ReaderSettingsSyncService } from './services/reader-settings-sync.service';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule],
  template: `
    <p-toast position="top-right"></p-toast>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {
  title = 'BookVault';

  constructor(_readerSettingsSync: ReaderSettingsSyncService) {}
}