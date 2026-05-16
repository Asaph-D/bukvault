import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, finalize } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../models/user.model';
import { NotificationPreferencesDto } from '../../models/api.types';

type FilterMode = 'all' | 'unread';

@Component({
  standalone: true,
  selector: 'app-notification-center',
  imports: [CommonModule, FormsModule],
  templateUrl: './notification-center.component.html',
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  items: Notification[] = [];
  filter: FilterMode = 'all';

  loading = false;
  loadingMore = false;
  prefsLoading = false;
  savingPrefs = false;
  prefsError: string | null = null;
  prefsSuccess: string | null = null;
  listError: string | null = null;

  unreadCount = 0;
  totalOnServer = 0;
  currentPage = 0;
  readonly pageSize = 20;
  private sub?: Subscription;

  prefsDraft: NotificationPreferencesDto = {
    emailEnabled: true,
    inAppEnabled: true,
    marketingEnabled: false,
  };

  constructor(
    private notifications: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.sub = this.notifications.unreadCount$.subscribe(c => {
      this.unreadCount = c;
    });
    this.reloadList();
    this.loadPreferences();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get filteredItems(): Notification[] {
    if (this.filter === 'unread') {
      return this.items.filter(n => !n.isRead);
    }
    return this.items;
  }

  get hasMore(): boolean {
    return this.items.length < this.totalOnServer;
  }

  setFilter(mode: FilterMode): void {
    this.filter = mode;
  }

  reloadList(): void {
    this.items = [];
    this.currentPage = 0;
    this.totalOnServer = 0;
    this.loadNextPage(true);
  }

  loadNextPage(reset = false): void {
    if (reset) {
      this.loading = true;
    } else {
      this.loadingMore = true;
    }
    this.listError = null;
    this.notifications
      .listPage(this.currentPage, this.pageSize)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.loadingMore = false;
        }),
      )
      .subscribe({
        next: page => {
          const merged = reset ? [...page.content] : [...this.items, ...page.content];
          const byId = new Map<string, Notification>();
          for (const n of merged) {
            byId.set(n.id, n);
          }
          this.items = [...byId.values()].sort((a, b) => b.date.getTime() - a.date.getTime());
          this.totalOnServer = page.totalElements;
          this.currentPage = page.number + 1;
        },
        error: () => {
          this.listError = 'Impossible de charger les notifications.';
        },
      });
  }

  loadMore(): void {
    if (!this.hasMore || this.loadingMore || this.loading) {
      return;
    }
    this.loadNextPage(false);
  }

  refreshAll(): void {
    this.notifications.refresh().subscribe();
    this.reloadList();
    this.loadPreferences();
  }

  loadPreferences(): void {
    this.prefsLoading = true;
    this.prefsError = null;
    this.notifications.getPreferences().subscribe({
      next: p => {
        this.prefsDraft = { ...p };
        this.prefsLoading = false;
      },
      error: () => {
        this.prefsError = 'Préférences indisponibles pour le moment.';
        this.prefsLoading = false;
      },
    });
  }

  savePreferences(): void {
    this.savingPrefs = true;
    this.prefsSuccess = null;
    this.prefsError = null;
    this.notifications.updatePreferences({ ...this.prefsDraft }).subscribe({
      next: p => {
        this.prefsDraft = { ...p };
        this.prefsSuccess = 'Préférences enregistrées.';
        this.savingPrefs = false;
      },
      error: () => {
        this.prefsError = 'Enregistrement impossible.';
        this.savingPrefs = false;
      },
    });
  }

  markOne(n: Notification): void {
    if (n.isRead) {
      return;
    }
    this.notifications.markAsRead(n.id).subscribe({
      error: () => {
        this.listError = 'Échec du marquage comme lu.';
      },
    });
    n.isRead = true;
  }

  markAll(): void {
    this.notifications.markAllAsRead().subscribe({
      next: () => {
        this.items = this.items.map(x => ({ ...x, isRead: true }));
      },
      error: () => {
        this.listError = 'Impossible de tout marquer comme lu.';
      },
    });
  }

  openAction(n: Notification): void {
    if (!n.link) {
      return;
    }
    if (!n.isRead) {
      this.notifications.markAsRead(n.id).subscribe();
      n.isRead = true;
    }
    const path = n.link.startsWith('http')
      ? n.link.replace(/^https?:\/\/[^/]+/, '') || '/'
      : n.link;
    this.router.navigateByUrl(path).catch(() => undefined);
  }

  getNotificationIconClass(type: string): string {
    switch (type) {
      case 'sale':
        return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300';
      case 'comment':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300';
      case 'update':
        return 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300';
      case 'payment':
        return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300';
      default:
        return 'bg-gray-100 dark:bg-zinc-700 text-gray-800 dark:text-zinc-200';
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'sale':
        return 'fas fa-shopping-cart';
      case 'comment':
        return 'fas fa-comment';
      case 'update':
        return 'fas fa-bullhorn';
      case 'payment':
        return 'fas fa-credit-card';
      default:
        return 'fas fa-bell';
    }
  }
}
