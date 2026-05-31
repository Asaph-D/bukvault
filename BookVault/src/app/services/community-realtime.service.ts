import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ChatMessageDto,
  MessagingConversationDto,
  SalonMessageDto,
} from '../models/api.types';

@Injectable({ providedIn: 'root' })
export class CommunityRealtimeService implements OnDestroy {
  private client: Client | null = null;
  private connectToken: string | null = null;
  private readonly destinationSubs = new Map<string, StompSubscription>();

  private readonly conversationMessages$ = new Subject<ChatMessageDto>();
  private readonly inboxUpdates$ = new Subject<MessagingConversationDto>();
  private readonly salonMessages$ = new Subject<SalonMessageDto>();

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
      webSocketFactory: () => new SockJS(environment.communityWsUrl),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });
    this.client.activate();
  }

  disconnect(): void {
    this.unsubscribeAll();
    if (this.client) {
      void this.client.deactivate();
      this.client = null;
    }
    this.connectToken = null;
  }

  onConversationMessage(): Observable<ChatMessageDto> {
    return this.conversationMessages$.asObservable();
  }

  onInboxUpdate(): Observable<MessagingConversationDto> {
    return this.inboxUpdates$.asObservable();
  }

  onSalonMessage(): Observable<SalonMessageDto> {
    return this.salonMessages$.asObservable();
  }

  watchConversation(conversationId: string): void {
    this.replaceSubscription(`/topic/conversations/${conversationId}`, msg => {
      this.conversationMessages$.next(JSON.parse(msg.body) as ChatMessageDto);
    });
  }

  watchInbox(): void {
    this.replaceSubscription('/user/queue/inbox', msg => {
      this.inboxUpdates$.next(JSON.parse(msg.body) as MessagingConversationDto);
    });
  }

  watchSalon(threadId: string): void {
    this.replaceSubscription(`/topic/salons/${threadId}`, msg => {
      this.salonMessages$.next(JSON.parse(msg.body) as SalonMessageDto);
    });
  }

  private replaceSubscription(destination: string, handler: (msg: IMessage) => void): void {
    const existing = this.destinationSubs.get(destination);
    if (existing) {
      try {
        existing.unsubscribe();
      } catch {
        /* ignore */
      }
      this.destinationSubs.delete(destination);
    }
    const client = this.client;
    if (!client) {
      return;
    }
    const attach = () => {
      const sub = client.subscribe(destination, handler);
      this.destinationSubs.set(destination, sub);
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

  private unsubscribeAll(): void {
    for (const sub of this.destinationSubs.values()) {
      try {
        sub.unsubscribe();
      } catch {
        /* ignore */
      }
    }
    this.destinationSubs.clear();
  }
}
