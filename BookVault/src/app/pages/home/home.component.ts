import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { BookService } from '../../services/book.service';
import { AuthorService } from '../../services/author.service';
import { Book, BookCategory, Author } from '../../models/book.model';
import { AuthorPublicProfileDto } from '../../models/api.types';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { Router, RouterModule } from '@angular/router';
import { CommunityService } from '../../services/community.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { AuthIntentService } from '../../services/auth-intent.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, RouterModule],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  books: Book[] = [];
  categories: BookCategory[] = [];
  authors: Author[] = [];
  bestSellers: Book[] = [];
  likedBookIds = new Set<string>();
  subscribedBookIds = new Set<string>();
  likeBusyIds = new Set<string>();
  subBusyIds = new Set<string>();
  cartBusyIds = new Set<string>();

  constructor(
    private bookService: BookService,
    private authorService: AuthorService,
    private communityService: CommunityService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private cartService: CartService,
    private router: Router,
    private authIntent: AuthIntentService
  ) {}

  ngOnInit(): void {
    forkJoin({
      grid: this.bookService.getBooks(0, 8),
      tops: this.bookService.getBestsellers(3),
      cats: this.bookService.getCategories()
    }).subscribe({
      next: ({ grid, tops, cats }) => {
        this.books = grid;
        this.bestSellers = tops;
        this.categories = cats;
        const ids = [...new Set(grid.map(b => b.authorId))].slice(0, 5);
        if (ids.length === 0) {
          this.authors = [];
          return;
        }
        forkJoin(
          ids.map(id =>
            this.authorService.getProfile(id).pipe(catchError(() => of(null)))
          )
        ).subscribe(profiles => {
          this.authors = (profiles as (AuthorPublicProfileDto | null)[])
            .filter((p): p is AuthorPublicProfileDto => p !== null)
            .map((p, i) => this.authorService.toAuthorUi(p, i));
        });

        if (this.authService.isAuthenticated()) {
          // Initialise les états like/abonnement pour les cartes du home
          forkJoin({
            likes: forkJoin(
              grid.map(b =>
                this.communityService.isBookLiked(b.id).pipe(catchError(() => of({ liked: false })))
              )
            ),
            subs: forkJoin(
              grid.map(b =>
                this.notificationService.isSubscribedToBook(b.id).pipe(catchError(() => of({ subscribed: false })))
              )
            ),
          }).subscribe(({ likes, subs }) => {
            grid.forEach((b, i) => {
              if (likes[i]?.liked) this.likedBookIds.add(b.id);
              if (subs[i]?.subscribed) this.subscribedBookIds.add(b.id);
            });
          });
        }
      }
    });
  }

  toggleLike(book: Book): void {
    if (!book || this.likeBusyIds.has(book.id)) return;
    if (!this.authService.isAuthenticated()) {
      this.authIntent.save(this.router.url, 'like');
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.likeBusyIds.add(book.id);
    const liked = this.likedBookIds.has(book.id);
    const req$ = liked ? this.communityService.unlikeBook(book.id) : this.communityService.likeBook(book.id);
    req$.pipe(finalize(() => this.likeBusyIds.delete(book.id))).subscribe({
      next: () => {
        liked ? this.likedBookIds.delete(book.id) : this.likedBookIds.add(book.id);
      },
    });
  }

  toggleSubscription(book: Book): void {
    if (!book || this.subBusyIds.has(book.id)) return;
    if (!this.authService.isAuthenticated()) {
      this.authIntent.save(this.router.url, 'subscribe');
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.subBusyIds.add(book.id);
    const sub = this.subscribedBookIds.has(book.id);
    const req$ = sub ? this.notificationService.unsubscribeBook(book.id) : this.notificationService.subscribeBook(book.id);
    req$.pipe(finalize(() => this.subBusyIds.delete(book.id))).subscribe({
      next: () => {
        sub ? this.subscribedBookIds.delete(book.id) : this.subscribedBookIds.add(book.id);
      },
    });
  }

  addToCart(book: Book): void {
    if (!book || this.cartBusyIds.has(book.id)) return;
    if (!this.authService.isAuthenticated()) {
      this.authIntent.save(this.router.url, 'cart');
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    const fmt = book.format === 'physical' ? 'PHYSICAL' : 'EBOOK';
    this.cartBusyIds.add(book.id);
    this.cartService.add(book.id, 1, fmt).pipe(finalize(() => this.cartBusyIds.delete(book.id))).subscribe();
  }
}