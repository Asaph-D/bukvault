import { Component, OnInit } from '@angular/core';
import { BookService, PLACEHOLDER_COVER } from '../../../../services/book.service';
import { ReviewService } from '../../../../services/review.service';
import { AuthService } from '../../../../services/auth.service';
import { MessagingService } from '../../../../services/messaging.service';
import { Book } from '../../../../models/book.model';
import { AuthorReviewItemDto, AuthorReviewsSummaryDto } from '../../../../models/api.types';
import { DashboardInternalHeaderComponent } from '../../shared/dashboard-internal-header.component';

@Component({
  standalone: true,
  selector: 'app-author-comments',
  imports: [CommonModule, FormsModule, RouterModule, DashboardInternalHeaderComponent],
  templateUrl: './author-comments.component.html',
})
export class AuthorCommentsComponent implements OnInit {
  readonly PLACEHOLDER_COVER = PLACEHOLDER_COVER;

  loading = true;
  error: string | null = null;

  items: AuthorReviewItemDto[] = [];
  summary: AuthorReviewsSummaryDto = { totalReviews: 0, averageRating: 0, booksWithReviews: 0 };
  totalPages = 0;
  page = 0;

  myBooks: Book[] = [];
  bookFilter = '';
  minRatingFilter: '' | '3' | '4' | '5' = '';

  replyDrafts: Record<number, string> = {};
  startingDm: string | null = null;

  constructor(
    private auth: AuthService,
    private bookService: BookService,
    private reviewService: ReviewService,
    private messaging: MessagingService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const u = this.auth.getCurrentUser();
    if (!u || u.role !== 'author') {
      this.error = 'Compte auteur requis.';
      this.loading = false;
      return;
    }
    this.bookService.getMyBooks(0, 100).subscribe({
      next: books => {
        this.myBooks = books.filter(b => b.status === 'PUBLISHED' || (b.reviewCount ?? 0) > 0);
        this.loadFeed(0);
      },
      error: () => {
        this.myBooks = [];
        this.loadFeed(0);
      },
    });
  }

  loadFeed(page = 0): void {
    this.loading = true;
    this.error = null;
    this.page = page;
    const minRating = this.minRatingFilter ? Number(this.minRatingFilter) : undefined;
    this.reviewService.listAuthorMine(page, 15, this.bookFilter || undefined, minRating).subscribe({
      next: feed => {
        this.items = feed.reviews.content ?? [];
        this.summary = feed.summary;
        this.totalPages = feed.reviews.totalPages ?? 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Impossible de charger les avis (review-service).';
        this.items = [];
      },
    });
  }

  applyFilters(): void {
    this.loadFeed(0);
  }

  prevPage(): void {
    if (this.page > 0) this.loadFeed(this.page - 1);
  }

  nextPage(): void {
    if (this.page + 1 < this.totalPages) this.loadFeed(this.page + 1);
  }

  reviewerLabel(r: AuthorReviewItemDto): string {
    return r.reviewerEmail || r.reviewerDisplayName || `Lecteur ${r.userId.slice(0, 8)}`;
  }

  reviewerInitials(r: AuthorReviewItemDto): string {
    const label = r.reviewerDisplayName || r.reviewerEmail || r.userId;
    const parts = label.split(/[\s@._-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return label.slice(0, 2).toUpperCase();
  }

  stars(n: number): number[] {
    return [1, 2, 3, 4, 5].slice(0, Math.max(0, Math.min(5, n)));
  }

  emptyStars(n: number): number[] {
    return [1, 2, 3, 4, 5].slice(Math.max(0, Math.min(5, n)));
  }

  onCoverErr(ev: Event): void {
    (ev.target as HTMLImageElement).src = PLACEHOLDER_COVER;
  }

  onAvatarErr(ev: Event): void {
    (ev.target as HTMLImageElement).style.display = 'none';
  }

  contactReader(review: AuthorReviewItemDto): void {
    if (this.startingDm) return;
    this.startingDm = review.userId;
    this.messaging.startDirect(review.userId).subscribe({
      next: conv => {
        this.startingDm = null;
        void this.router.navigate(['/dashboard/author/messages'], {
          queryParams: { conversationId: conv.id },
        });
      },
      error: () => {
        this.startingDm = null;
      },
    });
  }

  trackById(_i: number, r: AuthorReviewItemDto): number {
    return r.id;
  }
}
