// reader-messages.component.ts
import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DashboardInternalHeaderComponent } from '../../shared/dashboard-internal-header.component';
import { MessagingService } from '../../../../services/messaging.service';
import { AuthService } from '../../../../services/auth.service';
import { ChatMessageDto, MessagingConversationDto } from '../../../../models/api.types';

@Component({
  standalone: true,
  selector: 'app-reader-messages',
  imports: [CommonModule, FormsModule, RouterModule, DashboardInternalHeaderComponent],
  templateUrl: './reader-messages.component.html',
})
export class ReaderMessagesComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesEnd') private messagesEnd!: ElementRef;

  conversations: MessagingConversationDto[] = [];
  selected: MessagingConversationDto | null = null;
  messages: ChatMessageDto[] = [];
  draft = '';
  loadingList = true;
  loadingMessages = false;
  sending = false;
  error: string | null = null;
  currentUserId: string | null = null;

  /** Track whether we need to scroll to bottom after view update */
  private shouldScroll = false;

  constructor(
    private messaging: MessagingService,
    private auth: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(u => {
      this.currentUserId = u?.id ?? null;
    });

    this.refreshConversations();

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
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom(): void {
    try {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch (_) {}
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
      next: () => {
        this.draft = '';
        this.sending = false;
        this.loadMessages();
        this.refreshConversations();
      },
      error: () => {
        this.sending = false;
        this.error = 'Envoi impossible.';
      },
    });
  }

  /** Handle Ctrl+Enter / Cmd+Enter to send */
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
    return 'Utilisateur ' + c.peerUserId.slice(0, 8) + '…';
  }

  /** Initials avatar fallback */
  peerInitials(c: MessagingConversationDto): string {
    return c.peerUserId.slice(0, 2).toUpperCase();
  }

  /** Placeholder colour per peer (deterministic) */
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
}