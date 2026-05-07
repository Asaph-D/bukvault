import { Injectable } from '@angular/core';
import { EMPTY } from 'rxjs';
import { catchError, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ReaderUiPrefsService } from './reader-ui-prefs.service';
import { ThemeService } from './theme.service';
import { UserAccountService } from './user-account.service';

/**
 * À la connexion : charge les reader-settings et applique thème + attributs globaux.
 */
@Injectable({ providedIn: 'root' })
export class ReaderSettingsSyncService {
  constructor(
    private auth: AuthService,
    private account: UserAccountService,
    private theme: ThemeService,
    private uiPrefs: ReaderUiPrefsService
  ) {
    this.auth.currentUser$
      .pipe(
        distinctUntilChanged((a, b) => a?.id === b?.id),
        switchMap(user => {
          if (!user?.id) {
            this.uiPrefs.resetDocumentHints();
            return EMPTY;
          }
          return this.account.getReaderSettings(user.id).pipe(
            catchError(() =>
              this.account.bootstrapProfile().pipe(
                switchMap(() => this.account.getReaderSettings(user.id)),
                catchError(() => EMPTY)
              )
            )
          );
        })
      )
      .subscribe(settings => {
        this.theme.applyReaderApiPreference(settings.theme);
        this.uiPrefs.applyFromDto(settings);
      });
  }
}
