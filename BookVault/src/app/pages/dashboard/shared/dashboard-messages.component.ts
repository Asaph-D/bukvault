import { Component, OnInit, OnDestroy, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { DashboardInternalHeaderComponent } from './dashboard-internal-header.component';
import { MessagingService } from '../../../services/messaging.service';
import { CommunityService } from '../../../services/community.service';
import { CommunityRealtimeService } from '../../../services/community-realtime.service';
import { AuthService } from '../../../services/auth.service';
import {
  ChatMessageDto,
  CommunityMemberDto,
  MessagingConversationDto,
} from '../../../models/api.types';

export type DashboardMessagesVariant = 'reader' | 'author';

@Component({
  standalone: true,
  selector: 'app-dashboard-messages',
  imports: [CommonModule, FormsModule, RouterModule, DashboardInternalHeaderComponent],
  templateUrl: './dashboard-messages.component.html',
})
export class DashboardMessagesComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesEnd') private messagesEnd!: ElementRef;

  variant: DashboardMessagesVariant = 'reader';

  conversations: MessagingConversationDto[] = [];
  selected: MessagingConversationDto | null = null;
  messages: ChatMessageDto[] = [];
  draft = '';
  loadingList = true;
  loadingMessages = false;
  sending = false;
  error: string | null = null;
  currentUserId: string | null = null;

  memberQuery = '';
  memberResults: CommunityMemberDto[] = [];
  memberSearchLoading = false;

  private shouldScroll = false;
  private readonly subs = new Subscription();
  private watchedConversationId: string | null = null;
  private realtimeReady = false;

  constructor(
    private messaging: MessagingService,
    private community: CommunityService,
    private realtime: CommunityRealtimeService,
    private auth: AuthService,
    private route: ActivatedRoute
  ) {}

  get isAuthor(): boolean {
    return this.variant === 'author';
  }

  get pageTitle(): string {
    return this.isAuthor ? 'Messages lecteurs' : 'Messages';
  }

  get pageEyebrow(): string {
    return this.isAuthor ? 'Échanges avec votre audience' : 'Messagerie directe';
  }

  get pageSubtitle(): string {
    return this.isAuthor
      ? 'Répondez aux lecteurs, échangez en privé et suivez vos conversations en temps réel.'
      : 'Conversations privées avec les membres et auteurs de la communauté.';
  }

  get secondaryLink(): string {
    return this.isAuthor ? '/dashboard/author/home' : '/dashboard/reader/community';
  }

  get secondaryLabel(): string {
    return this.isAuthor ? 'Accueil auteur' : 'Hub communauté';
  }

  ngOnInit(): void {
    this.variant =
      (this.route.snapshot.data['messagesVariant'] as DashboardMessagesVariant) || 'reader';

    this.subs.add(
      this.auth.currentUser$.subscribe(u => {
        this.currentUserId = u?.id ?? null;
        const token = this.auth.getToken();
        if (token && !this.realtimeReady) {
          this.realtimeReady = true;
          this.realtime.connect(token);
          this.realtime.watchInbox();
        }
      })
    );

    this.subs.add(
      this.realtime.onConversationMessage().subscribe(msg => {
        if (this.selected) {
          this.upsertMessage(msg);
        }
      })
    );

    this.subs.add(
      this.realtime.onInboxUpdate().subscribe(summary => {
        const idx = this.conversations.findIndex(c => c.id === summary.id);
        if (idx >= 0) {
          this.conversations[idx] = summary;
        } else {
          this.conversations = [summary, ...this.conversations];
        }
        this.conversations.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        if (this.selected?.id === summary.id) {
          this.selected = summary;
        }
      })
    );

    this.refreshConversations();

    this.subs.add(
      this.route.queryParamMap.subscribe(p => {
        const convoId = p.get('conversationId');
        if (!convoId) return;

        const match = this.conversations.find(c => c.id === convoId);
        if (match) {
          this.select(match);
        } else {
          this.messaging.getConversations().subscribe({
            next: list => {
              this.conversations = list;
              const m = list.find(c => c.id === convoId);
              if (m) this.select(m);
            },
          });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.realtime.disconnect();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  searchMembers(): void {
    if (!this.isAuthor) return;
    const q = this.memberQuery.trim();
    if (q.length < 2) {
      this.memberResults = [];
      return;
    }
    this.memberSearchLoading = true;
    this.community.searchMembers(q, 8).subscribe({
      next: res => {
        this.memberResults = res;
        this.memberSearchLoading = false;
      },
      error: () => {
        this.memberResults = [];
        this.memberSearchLoading = false;
      },
    });
  }

  startConversation(userId: string): void {
    this.messaging.startDirect(userId).subscribe({
      next: conv => {
        const existing = this.conversations.find(c => c.id === conv.id);
        if (!existing) {
          this.conversations = [conv, ...this.conversations];
        }
        this.select(conv);
        this.memberResults = [];
        this.memberQuery = '';
      },
      error: () => {
        this.error = 'Impossible de démarrer la conversation.';
      },
    });
  }

  private scrollToBottom(): void {
    try {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      /* ignore */
    }
  }

  refreshConversations(): void {
    this.loadingList = true;
    this.error = null;
    this.messaging.getConversations().subscribe({
      next: list => {
        this.conversations = list;
        this.loadingList = false;
        if (!this.selected && list.length) {
          this.select(list[0]);
        }
      },
      error: () => {
        this.loadingList = false;
        this.error = 'Messagerie indisponible (community-service / gateway).';
      },
    });
  }

  select(c: MessagingConversationDto): void {
    this.selected = c;
    if (this.watchedConversationId !== c.id) {
      this.watchedConversationId = c.id;
      this.realtime.watchConversation(c.id);
    }
    this.loadMessages();
  }

  loadMessages(): void {
    if (!this.selected) {
      this.messages = [];
      return;
    }
    this.loadingMessages = true;
    this.messaging.getMessages(this.selected.id, 0, 80).subscribe({
      next: page => {
        this.messages = page.content;
        this.loadingMessages = false;
        this.shouldScroll = true;
      },
      error: () => {
        this.loadingMessages = false;
        this.messages = [];
        this.error = 'Impossible de charger les messages.';
      },
    });
  }

  send(): void {
    const text = this.draft.trim();
    if (!this.selected || !text || this.sending) return;
    this.sending = true;
    this.error = null;
    this.messaging.sendMessage(this.selected.id, text).subscribe({
      next: msg => {
        this.draft = '';
        this.sending = false;
        this.upsertMessage(msg);
        this.refreshConversations();
      },
      error: () => {
        this.sending = false;
        this.error = 'Envoi impossible.';
      },
    });
  }

  private upsertMessage(msg: ChatMessageDto): void {
    if (!this.messages.some(m => m.id === msg.id)) {
      this.messages = [...this.messages, msg];
      this.shouldScroll = true;
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.send();
    }
  }

  isMine(m: ChatMessageDto): boolean {
    return !!this.currentUserId && m.senderId === this.currentUserId;
  }

  peerLabel(c: MessagingConversationDto): string {
    return c.peerEmail || c.peerDisplayName || 'Utilisateur ' + c.peerUserId.slice(0, 8) + '…';
  }

  peerInitials(c: MessagingConversationDto): string {
    const label = c.peerDisplayName || c.peerEmail || c.peerUserId;
    const parts = label.split(/[\s@._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return label.slice(0, 2).toUpperCase();
  }

  messageAvatar(m: ChatMessageDto, c: MessagingConversationDto | null): string | null {
    if (this.isMine(m)) {
      return null;
    }
    return m.senderAvatarUrl || c?.peerAvatarUrl || null;
  }

  messageLabel(m: ChatMessageDto, c: MessagingConversationDto | null): string {
    if (this.isMine(m)) {
      return 'Moi';
    }
    return m.senderEmail || m.senderDisplayName || (c ? this.peerLabel(c) : 'Membre');
  }

  peerColor(c: MessagingConversationDto): string {
    const palette = [
      'from-sky-500 to-indigo-600',
      'from-violet-500 to-purple-700',
      'from-emerald-500 to-teal-600',
      'from-rose-500 to-pink-600',
      'from-amber-500 to-orange-600',
    ];
    const idx = c.peerUserId.charCodeAt(0) % palette.length;
    return palette[idx];
  }

  onAvatarError(ev: Event): void {
    const img = ev.target as HTMLImageElement;
    img.style.display = 'none';
    const fallback = img.nextElementSibling as HTMLElement | null;
    if (fallback) {
      fallback.classList.remove('hidden');
    }
  }
}
