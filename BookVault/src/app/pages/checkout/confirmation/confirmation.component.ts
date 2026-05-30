import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { AuthService } from '../../../services/auth.service';
import { OrderService } from '../../../services/order.service';
import { BookService, PLACEHOLDER_COVER } from '../../../services/book.service';
import { FileService } from '../../../services/file.service';
import { CartLineUi } from '../../../services/cart.service';
import { OrderResponseDto } from '../../../models/api.types';
import { UiToastService } from '../../../services/ui-toast.service';

interface ConfirmationItem {
  bookId: string;
  title: string;
  quantity: number;
  price: number;
  image: string;
}

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, RouterModule],
  template: `
    <app-header></app-header>
    
    <div class="pt-app-header bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div class="container mx-auto px-4 py-12">
        <div class="max-w-3xl mx-auto">
          <p *ngIf="loading" class="text-center text-zinc-600 dark:text-zinc-400">Chargement de la commande…</p>
          <p *ngIf="loadError" class="text-center text-red-600 dark:text-red-400 mb-6">{{ loadError }}</p>

          <div *ngIf="!loading && !loadError" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-8 text-center">
            <div class="w-20 h-20 mx-auto bg-emerald-100 dark:bg-emerald-950/80 rounded-full flex items-center justify-center mb-6 ring-1 ring-emerald-200/80 dark:ring-emerald-800">
              <i class="fas fa-check text-emerald-600 dark:text-emerald-400 text-3xl"></i>
            </div>
            
            <h1 class="text-2xl sm:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-4">Commande confirmée !</h1>
            <p class="text-zinc-600 dark:text-zinc-400 mb-2">Merci pour votre achat. Votre commande a été enregistrée et payée.</p>
            <p class="text-zinc-500 dark:text-zinc-500 text-sm mb-6">Un e-mail de confirmation vous a été envoyé (si les notifications e-mail sont activées).</p>
            
            <div class="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 p-6 rounded-xl mb-6 text-left">
              <h2 class="text-lg font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-4">Détails de la commande</h2>
              
              <div class="flex justify-between mb-2">
                <span class="text-zinc-600 dark:text-zinc-400">Numéro de commande :</span>
                <span class="font-medium text-slate-900 dark:text-white">#{{ orderNumber }}</span>
              </div>
              
              <div class="flex justify-between mb-2">
                <span class="text-zinc-600 dark:text-zinc-400">Date :</span>
                <span class="text-slate-900 dark:text-slate-100">{{ orderDate | date:'longDate' }}</span>
              </div>
              
              <div class="flex justify-between mb-2">
                <span class="text-zinc-600 dark:text-zinc-400">Email :</span>
                <span class="text-slate-900 dark:text-slate-100">{{ email }}</span>
              </div>
              
              <div class="flex justify-between mb-2">
                <span class="text-zinc-600 dark:text-zinc-400">Montant :</span>
                <span class="font-semibold text-slate-900 dark:text-white">{{ total | currency:'XAF':'symbol-narrow':'1.0-0' }}</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-zinc-600 dark:text-zinc-400">Statut :</span>
                <span class="text-slate-900 dark:text-slate-100">{{ orderStatus }}</span>
              </div>
            </div>
            
            <div class="mb-6 text-left" *ngIf="items.length">
              <h3 class="font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-3">Articles achetés</h3>
              <div class="space-y-4">
                <div *ngFor="let item of items" class="flex items-start border-b border-slate-200 dark:border-slate-700 pb-4">
                  <img [src]="item.image || placeholder" [alt]="item.title" class="w-12 h-16 object-cover rounded-sm mr-3 ring-1 ring-slate-200 dark:ring-slate-600 shrink-0">
                  <div class="flex-1 text-left min-w-0">
                    <h4 class="font-medium text-slate-900 dark:text-white">{{ item.title }}</h4>
                    <div class="flex justify-between text-sm mt-1">
                      <span class="text-zinc-500 dark:text-zinc-400">{{ item.quantity }} × {{ item.price | currency:'XAF':'symbol-narrow':'1.0-0' }}</span>
                      <span class="font-medium text-slate-900 dark:text-white">{{ item.quantity * item.price | currency:'XAF':'symbol-narrow':'1.0-0' }}</span>
                    </div>
                    <div class="flex flex-wrap gap-2 mt-3">
                      <a
                        [routerLink]="['/books', item.bookId]"
                        class="inline-flex items-center text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:brightness-110"
                      >
                        <i class="fas fa-book-open mr-1.5"></i> Lire
                      </a>
                      <button
                        type="button"
                        (click)="downloadBook(item)"
                        [disabled]="downloadingId === item.bookId"
                        class="inline-flex items-center text-sm border border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 disabled:opacity-50"
                      >
                        <i class="fas fa-download mr-1.5" *ngIf="downloadingId !== item.bookId"></i>
                        <i class="fas fa-spinner fa-spin mr-1.5" *ngIf="downloadingId === item.bookId"></i>
                        Télécharger
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="space-y-2 mb-8 text-zinc-600 dark:text-zinc-400 text-sm">
              <p>Vos livres sont aussi disponibles dans votre bibliothèque personnelle.</p>
            </div>
            
            <div class="flex flex-col sm:flex-row justify-center gap-4">
              <a [routerLink]="['/']" class="inline-flex justify-center bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-6 py-3 rounded-lg transition">
                Retour à l'accueil
              </a>
              <a [routerLink]="['/dashboard/reader/library']" class="inline-flex justify-center border-2 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 px-6 py-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition">
                Voir ma bibliothèque
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <app-footer></app-footer>
  `,
})
export class ConfirmationComponent implements OnInit {
  orderNumber = '';
  orderDate = new Date();
  email = '';
  total = 0;
  orderStatus = '';
  loading = true;
  loadError: string | null = null;
  downloadingId: string | null = null;
  placeholder = PLACEHOLDER_COVER;

  items: ConfirmationItem[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private orderService: OrderService,
    private bookService: BookService,
    private fileService: FileService,
    private toast: UiToastService,
  ) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as
      | { order?: OrderResponseDto; cartSnapshot?: CartLineUi[] }
      | undefined;
    if (state?.order) {
      this.applyOrder(state.order, state.cartSnapshot);
      this.loading = false;
    }
  }

  ngOnInit(): void {
    if (this.orderNumber) {
      return;
    }
    const idParam = this.route.snapshot.queryParamMap.get('orderId');
    if (!idParam) {
      this.loadError = 'Commande introuvable.';
      this.loading = false;
      return;
    }
    const id = Number(idParam);
    if (!Number.isFinite(id)) {
      this.loadError = 'Identifiant de commande invalide.';
      this.loading = false;
      return;
    }
    this.orderService.getOne(id).subscribe({
      next: order => {
        this.applyOrder(order);
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Impossible de charger la commande.';
        this.loading = false;
      },
    });
  }

  downloadBook(item: ConfirmationItem): void {
    this.downloadingId = item.bookId;
    this.fileService.downloadEbook(item.bookId).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${item.title.replace(/[^\w\s-]/g, '').trim() || 'ebook'}.bin`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloadingId = null;
        this.toast.success('Téléchargement démarré', item.title);
      },
      error: () => {
        this.downloadingId = null;
        this.toast.error('Téléchargement impossible', 'Droits ou fichier manquant.');
      },
    });
  }

  private applyOrder(order: OrderResponseDto, cartSnapshot?: CartLineUi[]): void {
    this.orderNumber = String(order.id);
    this.orderDate = new Date(order.createdAt);
    this.total = Number(order.totalAmount);
    this.orderStatus = order.status;
    const user = this.auth.getCurrentUser();
    this.email = user?.email ?? '—';

    if (cartSnapshot?.length) {
      this.items = cartSnapshot.map(line => ({
        bookId: line.bookId,
        title: line.title,
        quantity: line.quantity,
        price: line.price,
        image: line.image,
      }));
      return;
    }

    const lines = order.lines ?? [];
    if (!lines.length) {
      this.items = [];
      return;
    }

    forkJoin(
      lines.map(line =>
        this.bookService.getBookById(line.bookId).pipe(
          map(book => ({
            bookId: line.bookId,
            title: book?.title ?? `Livre ${line.bookId.slice(0, 8)}…`,
            quantity: line.quantity,
            price: Number(line.unitPrice),
            image: book?.coverImage ?? this.placeholder,
          })),
          catchError(() =>
            of({
              bookId: line.bookId,
              title: `Livre ${line.bookId.slice(0, 8)}…`,
              quantity: line.quantity,
              price: Number(line.unitPrice),
              image: this.placeholder,
            }),
          ),
        ),
      ),
    ).subscribe(items => {
      this.items = items;
    });
  }
}
