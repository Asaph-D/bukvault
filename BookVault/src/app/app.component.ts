import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ReaderSettingsSyncService } from './services/reader-settings-sync.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
})
export class AppComponent {
  title = 'BookVault';

  constructor(_readerSettingsSync: ReaderSettingsSyncService) {}
}