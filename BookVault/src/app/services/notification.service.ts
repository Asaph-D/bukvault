import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { Notification } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly base = `${environment.apiUrl}/notifications`;

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    this.refresh().subscribe();
  }

  /** Compat: ancien appel header `getNotifications()` */
  getNotifications(): Observable<Notification[]> {
    return this.refresh();
  }

  refresh(page = 0, size = 20): Observable<Notification[]> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http
      .get<{
        content: Array<{
          id: number;
          kind: 'ORDER' | 'PROMO' | 'SYSTEM' | 'REVIEW' | 'SOCIAL';
          title: string;
          message: string;
          read: boolean;
          createdAt: string;
        }>;
      }>(this.base, { params })
      .pipe(
        map(res =>
          res.content.map(n => ({
            id: String(n.id),
            userId: '',
            title: n.title,
            message: n.message,
            type: (n.kind === 'ORDER'
              ? 'payment'
              : n.kind === 'REVIEW'
                ? 'comment'
                : n.kind === 'SYSTEM'
                  ? 'update'
                  : 'info') as Notification['type'],
            isRead: n.read,
            date: new Date(n.createdAt),
          }))
        ),
        tap(list => {
          this.notificationsSubject.next(list);
          this.unreadCountSubject.next(list.filter(n => !n.isRead).length);
        })
      );
  }

  markAsRead(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/read`, {}).pipe(tap(() => this.refresh().subscribe()));
  }

  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.base}/read-all`, {}).pipe(tap(() => this.refresh().subscribe()));
  }

  /** Abonnement à un livre (notifications) */
  subscribeBook(bookId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/subscriptions/books`, { bookId });
  }

  unsubscribeBook(bookId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/subscriptions/books/${bookId}`);
  }

  isSubscribedToBook(bookId: string): Observable<{ subscribed: boolean }> {
    return this.http.get<{ subscribed: boolean }>(`${this.base}/subscriptions/books/${bookId}`);
  }
}