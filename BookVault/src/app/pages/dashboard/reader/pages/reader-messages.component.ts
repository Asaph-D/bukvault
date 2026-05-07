import { Component, OnInit } from '@angular/core';
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
export class ReaderMessagesComponent implements OnInit {
  conversations: MessagingConversationDto[] = [];
  selected: MessagingConversationDto | null = null;
  messages: ChatMessageDto[] = [];
  draft = '';
  loadingList = true;
  loadingMessages = false;
  sending = false;
  error: string | null = null;
  currentUserId: string | null = null;

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
        // If list not loaded yet, refresh will select when available
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
    if (!this.selected || !text || this.sending) {
      return;
    }
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

  isMine(m: ChatMessageDto): boolean {
    return !!this.currentUserId && m.senderId === this.currentUserId;
  }

  peerLabel(c: MessagingConversationDto): string {
    return 'Utilisateur ' + c.peerUserId.slice(0, 8) + '…';
  }
}
