import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BookService, PLACEHOLDER_COVER } from '../../../../services/book.service';
import { CommunityService } from '../../../../services/community.service';
import { MessagingService } from '../../../../services/messaging.service';
import { DashboardInternalHeaderComponent } from '../../shared/dashboard-internal-header.component';
import {
  CommunityBuddyDto,
  CommunityEventDto,
  CommunityHubDto,
  CommunityMemberDto,
  MessagingConversationDto,
  CommunityThreadDto
} from '../../../../models/api.types';

@Component({
  standalone: true,
  selector: 'app-reader-community',
  imports: [CommonModule, FormsModule, RouterModule, DashboardInternalHeaderComponent],
  templateUrl: './reader-community.component.html',
})
export class ReaderCommunityComponent implements OnInit {
  constructor(
    private bookService: BookService,
    private communityService: CommunityService,
    private messagingService: MessagingService,
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

  memberQuery = '';
  memberResults: CommunityMemberDto[] = [];
  memberSearchLoading = false;
  buddyRecommendations: CommunityMemberDto[] = [];

  ngOnInit(): void {
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
            i === 0
              ? { ...t, title: `« ${books[0].title} » — discussion communauté` }
              : t
          );
        }
        this.loadError = null;
      },
      error: () => {
        this.loadError = 'Impossible de charger le hub communauté.';
      },
    });
  }

  onCoverErr(ev: Event): void {
    (ev.target as HTMLImageElement).src = PLACEHOLDER_COVER;
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
        this.router.navigate(['/dashboard/reader/messages'], { queryParams: { conversationId: conv.id } });
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
