import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map, distinctUntilChanged } from 'rxjs/operators';
import { combineLatest, Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { User } from '../../models/user.model';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { ThemeId } from '../../services/theme.service';

/**
 * Barre de navigation fixe, calquée sur la barre titre de la page lecture (bordure légère, fond flouté, typo douce).
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header
      class="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-[#12121a]/90 backdrop-blur-md transition-colors"
    >
      <div class="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        <a [routerLink]="['/']" class="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
          <img
            src="assets/branding/bookvaulticon.png"
            alt=""
            class="h-8 w-8 sm:h-9 sm:w-9 object-contain rounded-lg shrink-0"
            width="36"
            height="36"
          />
          <span
            class="font-[family-name:var(--font-display)] text-base sm:text-lg font-semibold text-slate-900 dark:text-white tracking-tight truncate"
            >BookVault</span
          >
        </a>

        <nav *ngIf="!isDashboardArea" class="hidden lg:flex items-center justify-center gap-5 xl:gap-6 flex-1 min-w-0 mx-2">
          <a
            [routerLink]="['/']"
            class="text-sm text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition shrink-0"
            >Accueil</a
          >
          <a
            [routerLink]="['/categories']"
            class="text-sm text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition shrink-0"
            >Catégories</a
          >
          <a
            [routerLink]="['/about']"
            class="text-sm text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition shrink-0"
            >À propos</a
          >
          <a
            [routerLink]="['/contact']"
            class="text-sm text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition shrink-0"
            >Contact</a
          >
        </nav>

        <nav *ngIf="isDashboardArea" class="hidden lg:flex items-center justify-center gap-4 xl:gap-5 flex-1 min-w-0 mx-2">
          <a
            [routerLink]="['/']"
            class="text-sm text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition shrink-0"
            >Accueil public</a
          >
          <a
            [routerLink]="['/books']"
            class="text-sm text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition shrink-0"
            >Catalogue</a
          >
          <a
            [routerLink]="['/categories']"
            class="text-sm text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition shrink-0"
            >Catégories</a
          >
        </nav>

        <div class="hidden md:flex flex-1 max-w-[200px] lg:max-w-xs min-w-0">
          <div class="relative w-full">
            <input
              type="text"
              placeholder="Rechercher…"
              class="w-full text-sm py-1.5 pl-3 pr-8 rounded-lg bg-slate-100 dark:bg-zinc-800/90 border-0 text-slate-900 dark:text-slate-100 placeholder-zinc-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
            />
            <i class="fas fa-search absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none"></i>
          </div>
        </div>

        <div class="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <button
            type="button"
            (click)="toggleTheme()"
            class="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/10 transition"
            [attr.aria-label]="theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'"
            title="Thème"
          >
            <i [class]="theme === 'dark' ? 'fas fa-sun text-base' : 'fas fa-moon text-base'"></i>
          </button>

          <ng-container *ngIf="(currentUser$ | async); else loginTemplate">
            <a
              [routerLink]="dashboardEntryPath"
              class="hidden md:inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition"
              title="Tableau de bord"
            >
              <i class="fas fa-user text-xs opacity-80"></i>
            </a>
          </ng-container>
          <ng-template #loginTemplate>
            <a
              [routerLink]="['/auth/login']"
              class="hidden md:inline-flex text-sm text-indigo-600 dark:text-indigo-400 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition"
            >
              Connexion
            </a>
          </ng-template>

          <!-- Cloche : connectés, ou non connectés mais avec au moins une alerte locale (ex. session expirée). -->
          <div *ngIf="showNotifBell$ | async" class="relative">
            <button
              #notifBtn
              (click)="toggleNotifications()"
              class="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/10 relative"
              title="Notifications"
              type="button"
            >
              <i class="fas fa-bell text-base"></i>
              <span
                *ngIf="((unreadCount$ | async) || 0) > 0"
                class="absolute -top-0.5 -right-0.5 bg-red-500 text-white rounded-full h-4 min-w-[1rem] px-0.5 flex items-center justify-center text-[10px] leading-none"
              >
                {{ unreadCount$ | async }}
              </span>
            </button>
            <div
              *ngIf="showNotifications"
              #notifMenu
              class="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden z-20"
            >
              <div
                class="p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-zinc-800/80"
              >
                <h3 class="text-sm font-medium text-slate-900 dark:text-white">Notifications</h3>
                <button type="button" (click)="markAllAsRead()" class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                  Tout marquer lu
                </button>
              </div>
              <div class="max-h-96 overflow-y-auto">
                <div *ngIf="(notifications$ | async)?.length === 0" class="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  Aucune notification
                </div>
                <button
                  type="button"
                  *ngFor="let notification of (notifications$ | async)"
                  (click)="openNotification(notification)"
                  [ngClass]="{ 'bg-slate-50 dark:bg-slate-800/80': !notification.isRead }"
                  class="w-full text-left p-3 border-b border-slate-100 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div class="flex items-start">
                    <div
                      [ngClass]="getNotificationIconClass(notification.type)"
                      class="mr-3 rounded-full w-9 h-9 flex items-center justify-center text-sm shrink-0"
                    >
                      <i [class]="getNotificationIcon(notification.type)"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h4 class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ notification.title }}</h4>
                      <p class="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{{ notification.message }}</p>
                      <span class="text-[11px] text-zinc-400 dark:text-zinc-500">{{ notification.date | date: 'short' }}</span>
                    </div>
                  </div>
                </button>
              </div>
              <div *ngIf="currentUser$ | async" class="p-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-zinc-800/50">
                <a
                  [routerLink]="notificationsFullPath"
                  (click)="showNotifications = false"
                  class="block text-center text-xs font-medium text-indigo-600 dark:text-indigo-400 py-2 rounded-md hover:bg-white/80 dark:hover:bg-white/5"
                >
                  Voir tout
                </a>
              </div>
            </div>
          </div>
          <a
            [routerLink]="['/cart']"
            class="hidden sm:flex p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/10 relative"
            title="Panier"
          >
            <i class="fas fa-shopping-cart text-base"></i>
            <span
              *ngIf="cartCount > 0"
              class="absolute -top-0.5 -right-0.5 bg-red-500 text-white rounded-full h-4 min-w-[1rem] px-0.5 flex items-center justify-center text-[10px]"
              >{{ cartCount }}</span
            >
          </a>
          <button
            (click)="toggleMobileMenu()"
            class="md:hidden p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/10"
            type="button"
            aria-label="Menu"
          >
            <i class="fas fa-bars text-lg"></i>
          </button>
        </div>
      </div>

      <div
        *ngIf="mobileMenuOpen"
        class="md:hidden fixed top-app-header right-0 h-[calc(100vh-var(--app-header-height))] w-[min(100%,20rem)] bg-white dark:bg-[#12121a] border-l border-slate-200 dark:border-white/10 shadow-xl z-40 mobile-menu p-4"
        [class.open]="mobileMenuOpen"
      >
        <div class="flex flex-col gap-1">
          <button type="button" (click)="toggleTheme()" class="flex items-center gap-2 py-2.5 px-2 text-sm text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10">
            <i [class]="theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'"></i>
            {{ theme === 'dark' ? 'Mode clair' : 'Mode sombre' }}
          </button>
          <div class="relative mb-2 mt-1">
            <input
              type="text"
              placeholder="Rechercher…"
              class="w-full text-sm py-2 pl-3 pr-8 rounded-lg bg-slate-100 dark:bg-zinc-800 border-0 text-slate-900 dark:text-slate-100"
            />
            <i class="fas fa-search absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"></i>
          </div>
          <ng-container *ngIf="!isDashboardArea">
            <a
              [routerLink]="['/']"
              (click)="mobileMenuOpen = false"
              class="text-sm text-zinc-600 dark:text-zinc-400 py-2.5 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
              >Accueil</a
            >
            <a
              [routerLink]="['/categories']"
              (click)="mobileMenuOpen = false"
              class="text-sm text-zinc-600 dark:text-zinc-400 py-2.5 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
              >Catégories</a
            >
            <a
              [routerLink]="['/bestsellers']"
              (click)="mobileMenuOpen = false"
              class="text-sm text-zinc-600 dark:text-zinc-400 py-2.5 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
              >Meilleures ventes</a
            >
            <a
              [routerLink]="['/authors']"
              (click)="mobileMenuOpen = false"
              class="text-sm text-zinc-600 dark:text-zinc-400 py-2.5 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
              >Auteurs</a
            >
            <a
              [routerLink]="['/about']"
              (click)="mobileMenuOpen = false"
              class="text-sm text-zinc-600 dark:text-zinc-400 py-2.5 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
              >À propos</a
            >
            <a
              [routerLink]="['/contact']"
              (click)="mobileMenuOpen = false"
              class="text-sm text-zinc-600 dark:text-zinc-400 py-2.5 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
              >Contact</a
            >
          </ng-container>
          <ng-container *ngIf="isDashboardArea">
            <a
              [routerLink]="['/']"
              (click)="mobileMenuOpen = false"
              class="text-sm text-zinc-600 dark:text-zinc-400 py-2.5 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
              >Accueil public</a
            >
            <a
              [routerLink]="['/books']"
              (click)="mobileMenuOpen = false"
              class="text-sm text-zinc-600 dark:text-zinc-400 py-2.5 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
              >Catalogue</a
            >
            <a
              [routerLink]="['/categories']"
              (click)="mobileMenuOpen = false"
              class="text-sm text-zinc-600 dark:text-zinc-400 py-2.5 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
              >Catégories</a
            >
            <a
              [routerLink]="dashboardEntryPath"
              (click)="mobileMenuOpen = false"
              class="text-sm text-indigo-600 dark:text-indigo-400 py-2.5 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
              >Vue d’ensemble du tableau</a
            >
          </ng-container>
          <div class="flex justify-between items-center py-2 px-2 mt-1 border-t border-slate-200 dark:border-white/10">
            <a [routerLink]="['/cart']" (click)="mobileMenuOpen = false" class="text-sm text-zinc-600 dark:text-zinc-400">Panier</a>
            <span *ngIf="cartCount > 0" class="bg-red-500 text-white rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center text-xs">{{ cartCount }}</span>
          </div>
          <ng-container *ngIf="(currentUser$ | async) as user; else mobileLoginTemplate">
            <a
              [routerLink]="dashboardEntryPath"
              (click)="mobileMenuOpen = false"
              class="mt-2 text-center text-sm py-2.5 rounded-lg bg-indigo-600 text-white dark:bg-indigo-500"
            >
              <i class="fas fa-user mr-2"></i>Tableau de bord
            </a>
            <button type="button" (click)="logout(); mobileMenuOpen = false" class="text-left text-sm text-zinc-600 dark:text-zinc-400 py-2.5 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10">
              <i class="fas fa-sign-out-alt mr-2"></i>Déconnexion
            </button>
          </ng-container>
          <ng-template #mobileLoginTemplate>
            <a
              [routerLink]="['/auth/login']"
              (click)="mobileMenuOpen = false"
              class="mt-2 text-center text-sm py-2.5 rounded-lg bg-indigo-600 text-white dark:bg-indigo-500"
            >
              Connexion
            </a>
          </ng-template>
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent implements OnInit {
  currentUser$: Observable<User | null>;
  /** Affiche la cloche si connecté OU s’il y a des non lues (ex. alerte locale session expirée). */
  showNotifBell$: Observable<boolean>;
  notifications$: Observable<any[]>;
  unreadCount$: Observable<number>;
  showNotifications = false;
  mobileMenuOpen = false;
  cartCount = 0;
  theme: ThemeId = 'light';
  /** Zone `/dashboard/*` : navigation du header réduite (le détail est dans la sidebar). */
  isDashboardArea = false;
  /** Entrée « vue d’ensemble » selon le rôle (JWT). */
  dashboardEntryPath = '/dashboard';
  /** Lien vers le centre de notifications du tableau de bord. */
  notificationsFullPath = '/dashboard/reader/notifications';

  @ViewChild('notifBtn', { static: false }) notifBtn?: ElementRef<HTMLElement>;
  @ViewChild('notifMenu', { static: false }) notifMenu?: ElementRef<HTMLElement>;

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private notificationService: NotificationService,
    private router: Router,
    private themeService: ThemeService
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.notifications$ = this.notificationService.notifications$;
    this.unreadCount$ = this.notificationService.unreadCount$;
    this.showNotifBell$ = combineLatest([
      this.authService.currentUser$,
      this.notificationService.unreadCount$,
    ]).pipe(
      map(([user, unread]) => !!user || unread > 0),
      distinctUntilChanged(),
    );
  }

  ngOnInit(): void {
    this.applyDashboardContext();
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.applyDashboardContext());

    this.theme = this.themeService.theme;
    this.themeService.theme$.subscribe(t => {
      this.theme = t;
    });
    this.notificationService.getNotifications().subscribe();
    // Attendre un utilisateur chargé via /auth/me : le JWT est alors valide côté auth ;
    // évite un GET /cart avec jeton encore non validé ou une course avec restoreSession.
    this.authService.currentUser$.subscribe(user => {
      this.applyDashboardContext();
      if (user) {
        this.cartService.getCart().subscribe({
          next: lines => {
            this.cartCount = lines.reduce((s, l) => s + l.quantity, 0);
          },
          error: () => {
            this.cartCount = 0;
          }
        });
      } else {
        this.cartCount = 0;
      }
    });
  }

  private applyDashboardContext(): void {
    const url = this.router.url.split('?')[0];
    this.isDashboardArea = url.startsWith('/dashboard');
    const u = this.authService.getCurrentUser();
    if (!u) {
      this.dashboardEntryPath = '/dashboard';
      this.notificationsFullPath = '/dashboard/reader/notifications';
      return;
    }
    if (u.role === 'admin') {
      this.dashboardEntryPath = '/dashboard/admin/home';
      this.notificationsFullPath = '/dashboard/admin/notifications';
    } else if (u.role === 'author') {
      this.dashboardEntryPath = '/dashboard/author/home';
      this.notificationsFullPath = '/dashboard/author/notifications';
    } else {
      this.dashboardEntryPath = '/dashboard/reader/home';
      this.notificationsFullPath = '/dashboard/reader/notifications';
    }
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      // Charge depuis l’API (notification-service) à l’ouverture.
      this.notificationService.refresh().subscribe();
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id).subscribe();
  }

  openNotification(notification: { id: string; link?: string }): void {
    this.markAsRead(notification.id);
    this.showNotifications = false;
    if (notification.link) {
      const path = notification.link.startsWith('http')
        ? notification.link.replace(/^https?:\/\/[^/]+/, '') || '/'
        : notification.link;
      this.router.navigateByUrl(path);
    }
  }

  @HostListener('document:mousedown', ['$event'])
  onDocMouseDown(ev: MouseEvent): void {
    if (!this.showNotifications) return;
    const t = ev.target as Node | null;
    if (!t) return;
    const btn = this.notifBtn?.nativeElement;
    const menu = this.notifMenu?.nativeElement;
    const inside = (!!btn && btn.contains(t)) || (!!menu && menu.contains(t));
    if (!inside) {
      this.showNotifications = false;
    }
  }

  getNotificationIconClass(type: string): string {
    switch (type) {
      case 'sale':
        return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300';
      case 'comment':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300';
      case 'update':
        return 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300';
      case 'payment':
        return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300';
      default:
        return 'bg-gray-100 dark:bg-zinc-700 text-gray-800 dark:text-zinc-200';
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'sale':
        return 'fas fa-shopping-cart';
      case 'comment':
        return 'fas fa-comment';
      case 'update':
        return 'fas fa-bullhorn';
      case 'payment':
        return 'fas fa-credit-card';
      default:
        return 'fas fa-bell';
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
