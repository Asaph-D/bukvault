import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DashboardInternalHeaderComponent } from '../../shared/dashboard-internal-header.component';
import { OrderService } from '../../../../services/order.service';
import { ReadingService } from '../../../../services/reading.service';
import { BookService, PLACEHOLDER_COVER } from '../../../../services/book.service';
import { OrderResponseDto, ReadingProgressDto } from '../../../../models/api.types';
import { Book } from '../../../../models/book.model';
import { parseProgressPercent, readingMediaLabel } from '../utils/reading-progress.util';

type HistoryTab = 'orders' | 'reading';

interface OrderLineUi {
  lineId: number;
  bookId: string;
  title: string;
  author: string;
  cover: string;
  quantity: number;
  unitPrice: number;
  format: string;
  lineTotal: number;
}

interface OrderUi {
  order: OrderResponseDto;
  lines: OrderLineUi[];
}

interface ActivityRow {
  progress: ReadingProgressDto;
  book?: Book;
  percent: number;
}

@Component({
  standalone: true,
  selector: 'app-reader-history',
  imports: [CommonModule, RouterModule, DashboardInternalHeaderComponent],
  templateUrl: './reader-history.component.html',
})
export class ReaderHistoryComponent implements OnInit {
  readonly PLACEHOLDER_COVER = PLACEHOLDER_COVER;

  tab: HistoryTab = 'orders';

  orders: OrderUi[] = [];
  ordersPage = 0;
  ordersTotalPages = 0;
  ordersTotalElements = 0;
  ordersLoading = false;
  ordersError: string | null = null;

  activities: ActivityRow[] = [];
  activityLoading = true;
  activityError: string | null = null;

  constructor(
    private ordersApi: OrderService,
    private reading: ReadingService,
    private books: BookService,
  ) {}

  ngOnInit(): void {
    this.loadOrders(true);
    this.loadActivity();
  }

  onCoverErr(ev: Event): void {
    (ev.target as HTMLImageElement).src = PLACEHOLDER_COVER;
  }

  setTab(t: HistoryTab): void {
    this.tab = t;
  }

  statusLabel(s: string): string {
    switch (s) {
      case 'PENDING':
        return 'En attente';
      case 'PAID':
        return 'Payée';
      case 'SHIPPED':
        return 'Expédiée';
      case 'DELIVERED':
        return 'Livrée';
      case 'CANCELLED':
        return 'Annulée';
      default:
        return s;
    }
  }

  formatMoney(n: number, currency: string): string {
    try {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(n);
    } catch {
      return `${n} ${currency}`;
    }
  }

  labelMedia(m: string): string {
    return readingMediaLabel(m);
  }

  loadMoreOrders(): void {
    if (this.ordersPage + 1 >= this.ordersTotalPages || this.ordersLoading) return;
    this.ordersPage += 1;
    this.loadOrders(false);
  }

  private loadOrders(reset: boolean): void {
    this.ordersLoading = true;
    this.ordersError = null;
    const page = reset ? 0 : this.ordersPage;
    this.ordersApi.listMyOrders(page, 10).subscribe({
      next: pageDto => {
        if (reset) {
          this.orders = [];
        }
        this.ordersPage = pageDto.number;
        this.ordersTotalPages = pageDto.totalPages;
        this.ordersTotalElements = pageDto.totalElements;

        const newOrders = pageDto.content;
        if (!newOrders.length) {
          this.ordersLoading = false;
          return;
        }

        const enrichOne = (o: OrderResponseDto) => {
          const ids = [...new Set(o.lines.map(l => l.bookId))];
          if (!ids.length) {
            return of({ order: o, lines: [] as OrderLineUi[] });
          }
          return forkJoin(
            ids.map(id =>
              this.books.getBookById(id).pipe(
                map(b => ({ id, book: b })),
                catchError(() => of({ id, book: undefined as Book | undefined })),
              ),
            ),
          ).pipe(
            map(pairs => {
              const byId = new Map(pairs.map(p => [p.id, p.book]));
              const lines: OrderLineUi[] = o.lines.map(l => {
                const b = byId.get(l.bookId);
                return {
                  lineId: l.id,
                  bookId: l.bookId,
                  title: b?.title ?? 'Livre',
                  author: b?.author ?? '—',
                  cover: b?.coverImage ?? PLACEHOLDER_COVER,
                  quantity: l.quantity,
                  unitPrice: Number(l.unitPrice),
                  format: l.format,
                  lineTotal: Number(l.lineTotal),
                };
              });
              return { order: o, lines };
            }),
          );
        };

        forkJoin(newOrders.map(enrichOne)).subscribe({
          next: enriched => {
            this.orders = reset ? enriched : [...this.orders, ...enriched];
            this.ordersLoading = false;
          },
          error: () => {
            this.ordersError = 'Impossible de charger vos commandes.';
            this.ordersLoading = false;
          },
        });
      },
      error: () => {
        this.ordersError = 'Impossible de charger vos commandes.';
        this.ordersLoading = false;
      },
    });
  }

  private loadActivity(): void {
    this.activityLoading = true;
    this.activityError = null;
    this.reading.listProgress().subscribe({
      next: progresses => {
        if (!progresses.length) {
          this.activities = [];
          this.activityLoading = false;
          return;
        }
        const sorted = [...progresses].sort(
          (a, b) => new Date(b.serverUpdatedAt).getTime() - new Date(a.serverUpdatedAt).getTime(),
        );
        forkJoin(
          sorted.map(p =>
            this.books.getBookById(p.bookId).pipe(
              map(b => ({
                progress: p,
                book: b,
                percent: parseProgressPercent(p.positionJson),
              } satisfies ActivityRow)),
              catchError(() =>
                of({
                  progress: p,
                  book: undefined,
                  percent: parseProgressPercent(p.positionJson),
                } satisfies ActivityRow),
              ),
            ),
          ),
        ).subscribe({
          next: rows => {
            this.activities = rows;
            this.activityLoading = false;
          },
          error: () => {
            this.activityError = 'Activité indisponible.';
            this.activityLoading = false;
          },
        });
      },
      error: () => {
        this.activityError = 'Activité indisponible.';
        this.activityLoading = false;
      },
    });
  }
}
