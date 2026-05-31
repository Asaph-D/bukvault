// reader-community.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BookService, PLACEHOLDER_COVER } from '../../../../services/book.service';
import { CommunityService } from '../../../../services/community.service';
import { CommunityRealtimeService } from '../../../../services/community-realtime.service';
import { MessagingService } from '../../../../services/messaging.service';
import { AuthService } from '../../../../services/auth.service';
import { DashboardInternalHeaderComponent } from '../../shared/dashboard-internal-header.component';
import {
  CommunityBuddyDto,
  CommunityEventDto,
  CommunityHubDto,
  CommunityMemberDto,
  MessagingConversationDto,
  CommunityThreadDto,
  SalonMessageDto,
} from '../../../../models/api.types';

@Component({
  standalone: true,
  selector: 'app-reader-community',
  imports: [CommonModule, FormsModule, RouterModule, DashboardInternalHeaderComponent],
  templateUrl: './reader-community.component.html',
})
export class ReaderCommunityComponent implements OnInit, OnDestroy {
  constructor(
    private bookService: BookService,
    private communityService: CommunityService,
    private messagingService: MessagingService,
    private communityRealtime: CommunityRealtimeService,
    private auth: AuthService,
    private router: Router
  ) {}

  loadError: string | null = null;

  hub: CommunityHubDto | null = null;
  communityThreads: CommunityThreadDto[] = [];
  communityEvents: CommunityEventDto[] = [];
  communityBuddies: CommunityBuddyDto[] = [];

  authorsSpotlight: {
    name: string;
    role: string;
    status: string;
    avatar: string;
    bookId: string;
  }[] = [];

  composerDraft = '';
  flashThreadId: string | null = null;
  flashMessages: SalonMessageDto[] = [];
  flashSending = false;
  flashError: string | null = null;

  memberQuery = '';
  memberResults: CommunityMemberDto[] = [];
  memberSearchLoading = false;
  buddyRecommendations: CommunityMemberDto[] = [];

  private readonly subs = new Subscription();

  ngOnInit(): void {
    const token = this.auth.getToken();
    if (token) {
      this.communityRealtime.connect(token);
    }

    this.subs.add(
      this.communityRealtime.onSalonMessage().subscribe(msg => {
        if (this.flashThreadId && msg.threadId === this.flashThreadId) {
          this.upsertFlash(msg);
        }
      })
    );

    forkJoin({
      hub: this.communityService.getHub().pipe(
        catchError(() => of({ activeReaders: 0, openSalons: 0, tagline: '' }))
      ),
      threads: this.communityService.getThreads().pipe(catchError(() => of([]))),
      events: this.communityService.getEvents().pipe(catchError(() => of([]))),
      buddies: this.communityService.getBuddies().pipe(catchError(() => of([]))),
      recos: this.communityService.recommendBuddies(6).pipe(catchError(() => of([]))),
      books: this.bookService.getBestsellers(6).pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ hub: h, threads, events, buddies, recos, books }) => {
        this.hub = h;
        this.communityThreads = threads;
        this.communityEvents = events;
        this.communityBuddies = buddies;
        this.buddyRecommendations = recos;
        this.authorsSpotlight = books.slice(0, 3).map(b => ({
          name: b.author,
          role: b.category,
          status: `${b.rating.toFixed(1)}★ · ${b.reviewCount} avis · ${b.sales || 0} vues`,
          avatar: b.coverImage,
          bookId: b.id,
        }));
        if (books[0] && this.communityThreads.length) {
          this.communityThreads = this.communityThreads.map((t, i) =>
            i === 0 ? { ...t, title: `« ${books[0].title} » — discussion communauté` } : t
          );
        }
        if (threads.length) {
          this.selectFlashThread(threads[0].id);
        }
        this.loadError = null;
      },
      error: () => {
        this.loadError = 'Impossible de charger le hub communauté.';
      },
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.communityRealtime.disconnect();
  }

  selectFlashThread(threadId: string): void {
    this.flashThreadId = threadId;
    this.communityRealtime.watchSalon(threadId);
    this.communityService.getSalonMessages(threadId, 0, 25).subscribe({
      next: page => {
        this.flashMessages = page.content ?? [];
      },
      error: () => {
        this.flashMessages = [];
      },
    });
  }

  sendFlash(): void {
    const text = this.composerDraft.trim();
    if (!this.flashThreadId || !text || this.flashSending) return;
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.flashSending = true;
    this.flashError = null;
    this.communityService.sendSalonMessage(this.flashThreadId, text).subscribe({
      next: msg => {
        this.composerDraft = '';
        this.flashSending = false;
        this.upsertFlash(msg);
      },
      error: () => {
        this.flashSending = false;
        this.flashError = 'Publication impossible.';
      },
    });
  }

  private upsertFlash(msg: SalonMessageDto): void {
    if (!this.flashMessages.some(m => m.id === msg.id)) {
      this.flashMessages = [...this.flashMessages, msg].slice(-30);
    }
  }

  flashLabel(m: SalonMessageDto): string {
    return m.senderEmail || m.senderDisplayName || 'Membre';
  }

  flashInitials(m: SalonMessageDto): string {
    const label = m.senderDisplayName || m.senderEmail || m.senderId;
    const parts = label.split(/[\s@._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return label.slice(0, 2).toUpperCase();
  }

  onCoverErr(ev: Event): void {
    (ev.target as HTMLImageElement).src = PLACEHOLDER_COVER;
  }

  onAvatarErr(ev: Event): void {
    (ev.target as HTMLImageElement).style.display = 'none';
  }

  searchMembers(): void {
    const q = this.memberQuery.trim();
    if (q.length < 2) {
      this.memberResults = [];
      return;
    }
    this.memberSearchLoading = true;
    this.communityService.searchMembers(q, 12).subscribe({
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
    this.messagingService.startDirect(userId).subscribe({
      next: (conv: MessagingConversationDto) => {
        this.router.navigate(['/dashboard/reader/messages'], {
          queryParams: { conversationId: conv.id },
        });
      },
    });
  }

  likeBook(bookId: string): void {
    this.communityService.likeBook(bookId).subscribe({
      next: () => {
        this.communityService.recommendBuddies(6).subscribe({
          next: recos => (this.buddyRecommendations = recos),
        });
      },
    });
  }
}
