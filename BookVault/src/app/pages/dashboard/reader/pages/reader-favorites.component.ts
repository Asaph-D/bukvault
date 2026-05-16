import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { DashboardInternalHeaderComponent } from '../../shared/dashboard-internal-header.component';
import { WishlistService } from '../../../../services/wishlist.service';
import { BookService, PLACEHOLDER_COVER } from '../../../../services/book.service';
import { WishlistItemDto } from '../../../../models/api.types';
import { Book } from '../../../../models/book.model';

interface WishlistRow {
  item: WishlistItemDto;
  book?: Book;
}

@Component({
  standalone: true,
  selector: 'app-reader-favorites',
  imports: [CommonModule, RouterModule, DashboardInternalHeaderComponent],
  templateUrl: './reader-favorites.component.html',
})
export class ReaderFavoritesComponent implements OnInit {
  readonly PLACEHOLDER_COVER = PLACEHOLDER_COVER;

  rows: WishlistRow[] = [];
  loading = true;
  error: string | null = null;
  busyIds = new Set<string>();
  moveBusy = false;
  banner: { kind: 'success' | 'danger'; text: string } | null = null;

  constructor(
    private wishlist: WishlistService,
    private books: BookService,
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  onCoverErr(ev: Event): void {
    (ev.target as HTMLImageElement).src = PLACEHOLDER_COVER;
  }

  reload(): void {
    this.loading = true;
    this.error = null;
    this.wishlist
      .list()
      .pipe(
        switchMap(items => {
          if (!items.length) {
            return of([] as WishlistRow[]);
          }
          return forkJoin(
            items.map(it =>
              this.books.getBookById(it.bookId).pipe(
                map(b => ({ item: it, book: b } as WishlistRow)),
                catchError(() => of({ item: it, book: undefined } as WishlistRow)),
              ),
            ),
          );
        }),
      )
      .subscribe({
        next: rows => {
          this.rows = rows;
          this.loading = false;
        },
        error: () => {
          this.error = 'Impossible de charger vos favoris.';
          this.loading = false;
        },
      });
  }

  remove(bookId: string): void {
    if (this.busyIds.has(bookId)) return;
    this.busyIds.add(bookId);
    this.wishlist.remove(bookId).subscribe({
      next: () => {
        this.rows = this.rows.filter(r => r.item.bookId !== bookId);
        this.busyIds.delete(bookId);
      },
      error: () => {
        this.banner = { kind: 'danger', text: 'Retrait impossible. Réessayez.' };
        this.busyIds.delete(bookId);
      },
    });
  }

  moveAllToCart(): void {
    if (this.moveBusy || !this.rows.length) return;
    this.moveBusy = true;
    this.banner = null;
    this.wishlist.moveAllToCart().subscribe({
      next: res => {
        this.moveBusy = false;
        const n = res.addedToCart?.length ?? 0;
        const errN = res.errors?.length ?? 0;
        if (n > 0) {
          this.banner = {
            kind: 'success',
            text: `${n} titre(s) ajouté(s) au panier.${errN ? ` ${errN} erreur(s).` : ''}`,
          };
        } else if (errN) {
          this.banner = { kind: 'danger', text: 'Aucun titre ajouté. Vérifiez le panier et le catalogue.' };
        }
        this.reload();
      },
      error: () => {
        this.moveBusy = false;
        this.banner = { kind: 'danger', text: 'Transfert vers le panier impossible.' };
      },
    });
  }

  clearBanner(): void {
    this.banner = null;
  }
}
