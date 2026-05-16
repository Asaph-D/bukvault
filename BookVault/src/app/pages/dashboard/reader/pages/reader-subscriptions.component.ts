import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DashboardInternalHeaderComponent } from '../../shared/dashboard-internal-header.component';
import { AuthService } from '../../../../services/auth.service';
import { NotificationService } from '../../../../services/notification.service';
import { BookService, PLACEHOLDER_COVER } from '../../../../services/book.service';
import { BookSubscriptionItemDto } from '../../../../models/api.types';
import { Book } from '../../../../models/book.model';

interface PlanCard {
  id: string;
  name: string;
  blurb: string;
  priceLabel: string;
  highlight: boolean;
  features: string[];
}

interface BookAlertRow {
  sub: BookSubscriptionItemDto;
  book?: Book;
}

@Component({
  standalone: true,
  selector: 'app-reader-subscriptions',
  imports: [CommonModule, RouterModule, DashboardInternalHeaderComponent],
  templateUrl: './reader-subscriptions.component.html',
})
export class ReaderSubscriptionsComponent implements OnInit {
  readonly PLACEHOLDER_COVER = PLACEHOLDER_COVER;

  readonly plans: PlanCard[] = [
    {
      id: 'free',
      name: 'Lecteur',
      blurb: 'Accès au catalogue, achats à l’unité et alertes optionnelles par livre.',
      priceLabel: '0 €',
      highlight: false,
      features: [
        'Notifications par livre (cloche)',
        'Historique d’achats',
        'Communauté & messages',
      ],
    },
    {
      id: 'plus',
      name: 'Lecteur Plus',
      blurb: 'Pour ceux qui lisent chaque semaine : confort et crédits mensuels (à venir).',
      priceLabel: '9,90 € / mois',
      highlight: true,
      features: [
        'Crédits numériques mensuels',
        'Synchronisation multi-appareils prioritaire',
        'Soutien au catalogue indépendant',
      ],
    },
    {
      id: 'family',
      name: 'Famille',
      blurb: 'Plusieurs profils sous un même compte facturation (bientôt).',
      priceLabel: '19,90 € / mois',
      highlight: false,
      features: ['Jusqu’à 4 profils', 'Contrôle parental simplifié', 'Une facture unique'],
    },
  ];

  bookRows: BookAlertRow[] = [];
  booksLoading = true;
  booksError: string | null = null;
  busyUnsub = new Set<string>();

  constructor(
    private auth: AuthService,
    private notifications: NotificationService,
    private books: BookService,
  ) {}

  get displayPlanLabel(): string {
    const u = this.auth.getCurrentUser();
    const p = u?.subscriptionPlan;
    if (!p) return 'Gratuit (catalogue & achats)';
    if (p === 'enterprise') return 'Entreprise / partenaire';
    if (p === 'professional') return 'Lecteur Plus (invitation)';
    return 'Lecteur standard';
  }

  ngOnInit(): void {
    this.reloadBookAlerts();
  }

  reloadBookAlerts(): void {
    this.booksLoading = true;
    this.booksError = null;
    this.notifications.listBookSubscriptions().subscribe({
      next: items => {
        if (!items.length) {
          this.bookRows = [];
          this.booksLoading = false;
          return;
        }
        forkJoin(
          items.map(it =>
            this.books.getBookById(it.bookId).pipe(
              map(b => ({ sub: it, book: b } as BookAlertRow)),
              catchError(() => of({ sub: it, book: undefined } as BookAlertRow)),
            ),
          ),
        ).subscribe({
          next: rows => {
            this.bookRows = rows;
            this.booksLoading = false;
          },
          error: () => {
            this.booksError = 'Impossible de charger vos alertes livres.';
            this.booksLoading = false;
          },
        });
      },
      error: () => {
        this.booksError = 'Impossible de charger vos alertes livres.';
        this.booksLoading = false;
      },
    });
  }

  onCoverErr(ev: Event): void {
    (ev.target as HTMLImageElement).src = PLACEHOLDER_COVER;
  }

  unsubscribe(bookId: string): void {
    if (this.busyUnsub.has(bookId)) return;
    this.busyUnsub.add(bookId);
    this.notifications.unsubscribeBook(bookId).subscribe({
      next: () => {
        this.bookRows = this.bookRows.filter(r => r.sub.bookId !== bookId);
        this.busyUnsub.delete(bookId);
      },
      error: () => {
        this.busyUnsub.delete(bookId);
        this.booksError = 'Désabonnement impossible. Réessayez.';
      },
    });
  }
}
