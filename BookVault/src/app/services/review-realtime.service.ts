import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { ReviewResponseDto } from '../models/api.types';

@Injectable({ providedIn: 'root' })
export class ReviewRealtimeService implements OnDestroy {
  private client: Client | null = null;
  private connectToken: string | null = null;
  private bookSub: StompSubscription | null = null;
  private watchedBookId: string | null = null;

  private readonly reviews$ = new Subject<ReviewResponseDto>();

  ngOnDestroy(): void {
    this.disconnect();
  }

  connect(token: string): void {
    if (this.client?.connected && this.connectToken === token) {
      return;
    }
    this.disconnect();
    this.connectToken = token;
    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.reviewWsUrl),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });
    this.client.activate();
  }

  disconnect(): void {
    this.unsubscribeBook();
    if (this.client) {
      void this.client.deactivate();
      this.client = null;
    }
    this.connectToken = null;
    this.watchedBookId = null;
  }

  onReview(): Observable<ReviewResponseDto> {
    return this.reviews$.asObservable();
  }

  watchBook(bookId: string): void {
    if (this.watchedBookId === bookId && this.bookSub) {
      return;
    }
    this.unsubscribeBook();
    this.watchedBookId = bookId;
    const destination = `/topic/books/${bookId}/reviews`;
    const client = this.client;
    if (!client) {
      return;
    }
    const attach = () => {
      this.bookSub = client.subscribe(destination, msg => {
        this.reviews$.next(JSON.parse(msg.body) as ReviewResponseDto);
      });
    };
    if (client.connected) {
      attach();
    } else {
      const prev = client.onConnect;
      client.onConnect = frame => {
        prev?.(frame);
        attach();
      };
    }
  }

  private unsubscribeBook(): void {
    if (this.bookSub) {
      try {
        this.bookSub.unsubscribe();
      } catch {
        /* ignore */
      }
      this.bookSub = null;
    }
  }
}
