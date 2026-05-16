import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, map, switchMap, tap, catchError, of } from 'rxjs';
import { Notification } from '../models/user.model';
import { environment } from '../../environments/environment';
import { NotificationPreferencesDto, PageDto, BookSubscriptionItemDto } from '../models/api.types';
import { readAccessToken } from './auth-token.store';
import {
  AUTH_SESSION_EXPIRED_UI_EVENT,
  AUTH_SESSION_RESTORED_UI_EVENT,
} from './auth-ui.events';

interface NotificationRowDto {
  id: number;
  kind: 'ORDER' | 'PROMO' | 'SYSTEM' | 'REVIEW' | 'SOCIAL' | 'BOOK';
  title: string;
  message: string;
  actionUrl?: string | null;
  read: boolean;
  createdAt: string;
}

export const LOCAL_SESSION_EXPIRED_ID = 'local-session-expired';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly base = `${environment.apiUrl}/notifications`;

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    if (typeof window !== 'undefined') {
      window.addEventListener(AUTH_SESSION_EXPIRED_UI_EVENT, () => this.enqueueSessionExpired());
      window.addEventListener(AUTH_SESSION_RESTORED_UI_EVENT, () => this.removeSessionExpiredLocal());
    }
    if (readAccessToken()) {
      this.refresh().subscribe({ error: () => {} });
    }
  }

  isLocalNotificationId(id: string): boolean {
    return id.startsWith('local-');
  }

  /** Notification affichée dans la cloche (pas d’appel API). */
  private enqueueSessionExpired(): void {
    const cur = this.notificationsSubject.getValue();
    if (cur.some(n => n.id === LOCAL_SESSION_EXPIRED_ID)) {
      return;
    }
    const n: Notification = {
      id: LOCAL_SESSION_EXPIRED_ID,
      userId: '',
      title: 'Session expirée',
      message: 'Veuillez vous reconnecter pour continuer.',
      type: 'update',
      isRead: false,
      date: new Date(),
      link: '/auth/login',
    };
    this.notificationsSubject.next([n, ...cur]);
    this.unreadCountSubject.next(this.unreadCountSubject.getValue() + 1);
  }

  private removeSessionExpiredLocal(): void {
    const cur = this.notificationsSubject.getValue();
    if (!cur.some(n => n.id === LOCAL_SESSION_EXPIRED_ID)) {
      return;
    }
    const wasUnread = cur.some(n => n.id === LOCAL_SESSION_EXPIRED_ID && !n.isRead);
    const next = cur.filter(n => n.id !== LOCAL_SESSION_EXPIRED_ID);
    this.notificationsSubject.next(next);
    if (wasUnread) {
      this.unreadCountSubject.next(Math.max(0, this.unreadCountSubject.getValue() - 1));
    }
  }

  /** Garde les entrées `local-*` en tête, puis le résultat serveur. */
  private mergeServerWithLocals(serverRows: Notification[]): Notification[] {
    const locals = this.notificationsSubject.getValue().filter(m => this.isLocalNotificationId(m.id));
    return [...locals, ...serverRows];
  }

  /** Compat header : premier lot pour le menu déroulant. */
  getNotifications(): Observable<Notification[]> {
    return this.refresh();
  }

  private mapRow(n: NotificationRowDto): Notification {
    return {
      id: String(n.id),
      userId: '',
      title: n.title,
      message: n.message,
      type: (n.kind === 'ORDER'
        ? 'payment'
        : n.kind === 'REVIEW'
          ? 'comment'
          : n.kind === 'BOOK'
            ? 'sale'
            : n.kind === 'SYSTEM'
              ? 'update'
              : 'info') as Notification['type'],
      isRead: n.read,
      date: new Date(n.createdAt),
      link: n.actionUrl?.trim() || undefined,
    };
  }

  /** Une page d’historique (Spring `Page`). */
  listPage(page: number, size: number): Observable<PageDto<Notification>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<PageDto<NotificationRowDto>>(this.base, { params }).pipe(
      map(p => ({
        ...p,
        content: p.content.map(row => this.mapRow(row)),
      })),
    );
  }

  refreshUnreadCount(): Observable<number> {
    return this.http.get<{ count: number }>(`${this.base}/unread-count`).pipe(
      map(r => r.count),
      tap(c => this.syncUnreadWithServer(c)),
      catchError(() => {
        this.recalcUnreadFromCurrentList();
        return of(this.unreadCountSubject.getValue());
      }),
    );
  }

  private countUnreadLocals(): number {
    return this.notificationsSubject
      .getValue()
      .filter(n => this.isLocalNotificationId(n.id) && !n.isRead).length;
  }

  private syncUnreadWithServer(serverTotal: number): void {
    this.unreadCountSubject.next(serverTotal + this.countUnreadLocals());
  }

  private recalcUnreadFromCurrentList(): void {
    const n = this.notificationsSubject.getValue().filter(x => !x.isRead).length;
    this.unreadCountSubject.next(n);
  }

  refresh(page = 0, size = 20): Observable<Notification[]> {
    if (!readAccessToken()) {
      const onlyLocals = this.notificationsSubject.getValue().filter(n => this.isLocalNotificationId(n.id));
      this.notificationsSubject.next(onlyLocals);
      this.recalcUnreadFromCurrentList();
      return of(onlyLocals);
    }
    return this.listPage(page, size).pipe(
      switchMap(p => {
        const merged = this.mergeServerWithLocals(p.content);
        this.notificationsSubject.next(merged);
        return this.refreshUnreadCount().pipe(
          catchError(() => {
            this.recalcUnreadFromCurrentList();
            return of(this.unreadCountSubject.getValue());
          }),
          map(() => merged),
        );
      }),
      catchError(() => {
        const onlyLocals = this.notificationsSubject.getValue().filter(n => this.isLocalNotificationId(n.id));
        this.notificationsSubject.next(onlyLocals);
        this.recalcUnreadFromCurrentList();
        return of(onlyLocals);
      }),
    );
  }

  private markAllReadLocal(): void {
    const next = this.notificationsSubject.getValue().map(n => ({ ...n, isRead: true }));
    this.notificationsSubject.next(next);
    this.unreadCountSubject.next(0);
  }

  private markOneReadLocal(id: string): void {
    const cur = this.notificationsSubject.getValue();
    const next = cur.map(n => (n.id === id ? { ...n, isRead: true } : n));
    this.notificationsSubject.next(next);
    const wasUnread = cur.some(n => n.id === id && !n.isRead);
    if (wasUnread) {
      this.unreadCountSubject.next(Math.max(0, this.unreadCountSubject.getValue() - 1));
    }
  }

  markAsRead(id: string): Observable<void> {
    if (this.isLocalNotificationId(id)) {
      this.markOneReadLocal(id);
      return of(undefined);
    }
    return this.http.patch<NotificationRowDto>(`${this.base}/${id}/read`, {}).pipe(
      tap(() => {
        this.markOneReadLocal(id);
        this.refreshUnreadCount().subscribe({ error: () => this.recalcUnreadFromCurrentList() });
      }),
      map(() => undefined),
    );
  }

  markAllAsRead(): Observable<void> {
    if (!readAccessToken()) {
      const next = this.notificationsSubject.getValue().map(n =>
        this.isLocalNotificationId(n.id) ? { ...n, isRead: true } : n,
      );
      this.notificationsSubject.next(next);
      this.recalcUnreadFromCurrentList();
      return of(undefined);
    }
    return this.http.post<{ updatedCount: number }>(`${this.base}/read-all`, {}).pipe(
      tap(() => {
        this.markAllReadLocal();
        this.refreshUnreadCount().subscribe({ error: () => {} });
      }),
      map(() => undefined),
    );
  }

  getPreferences(): Observable<NotificationPreferencesDto> {
    return this.http.get<NotificationPreferencesDto>(`${this.base}/preferences`);
  }

  updatePreferences(body: NotificationPreferencesDto): Observable<NotificationPreferencesDto> {
    return this.http.put<NotificationPreferencesDto>(`${this.base}/preferences`, body);
  }

  /** Abonnement à un livre (notifications) */
  subscribeBook(bookId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/subscriptions/books`, { bookId });
  }

  /** Livres suivis pour alertes (cloche sur la fiche livre). */
  listBookSubscriptions(): Observable<BookSubscriptionItemDto[]> {
    return this.http.get<BookSubscriptionItemDto[]>(`${this.base}/subscriptions/books`);
  }

  unsubscribeBook(bookId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/subscriptions/books/${bookId}`);
  }

  isSubscribedToBook(bookId: string): Observable<{ subscribed: boolean }> {
    return this.http.get<{ subscribed: boolean }>(`${this.base}/subscriptions/books/${bookId}`);
  }
}
