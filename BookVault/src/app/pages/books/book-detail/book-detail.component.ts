import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, forkJoin, of, interval } from 'rxjs';
import { switchMap, tap, catchError, finalize } from 'rxjs/operators';
import { BookService } from '../../../services/book.service';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';
import { Book } from '../../../models/book.model';
import { FileService } from '../../../services/file.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PdfPageFlipComponent } from '../../../shared/pdf-page-flip/pdf-page-flip.component';
import { User } from '../../../models/user.model';
import { CommunityService } from '../../../services/community.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthIntentService } from '../../../services/auth-intent.service';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PdfPageFlipComponent],
  templateUrl: './book-detail.component.html',
  styleUrls: ['./book-detail.component.css']
})
export class BookDetailComponent implements OnInit, OnDestroy {
  @ViewChild('leftToolbar', { static: false }) leftToolbar?: ElementRef<HTMLElement>;
  @ViewChild('leftToolPanelEl', { static: false }) leftToolPanelEl?: ElementRef<HTMLElement>;
  @ViewChild(PdfPageFlipComponent, { static: false }) flipbook?: PdfPageFlipComponent;
  book: Book | undefined;
  libraryBooks: Book[] = [];
  loading = true;
  cartBusy = false;
  likeBusy = false;
  subscribeBusy = false;
  liked = false;
  subscribedToAuthor = false; // abonnement notifications pour CE livre
  manuscriptBusy = false;
  manuscriptError: string | null = null;
  manuscriptUrl: SafeResourceUrl | null = null; // PDF pour iframe
  manuscriptDownloadUrl: SafeResourceUrl | null = null; // EPUB/MOBI/PDF (download)
  manuscriptMime: string | null = null;
  private manuscriptObjectUrl: string | null = null;
  readMode: 'manuscript' | 'excerpt' = 'manuscript';

  /** Barre outils gauche : panneau actif */
  leftToolPanel: 'font' | 'toc' | 'search' | null = null;
  /** Vue “livre ouvert” : deux pages côte à côte (PDF) ou colonnes (extrait) */
  spreadView = false;
  /** Vrai feuilletage (page turning) pour PDF */
  pageFlipMode = false;
  /** Page PDF de début (lecteur navigateur : fragment #page=n) */
  pdfSpreadStartPage = 1;
  searchQuery = '';

  chapterIndex = 1;
  chapterTitleExtra = '';
  chapterParagraphs: string[] = [];
  highlightParagraphIndex = 0;
  totalChapters = 8;
  tocEntries: { index: number; title: string }[] = [];
  private descriptionChunks: string[] = [];

  readerTheme: 'aube' | 'nuit' | 'sepia' | 'foret' = 'nuit';
  readerThemes = [
    { id: 'aube' as const, label: 'Aube' },
    { id: 'sepia' as const, label: 'Sépia' },
    { id: 'nuit' as const, label: 'Nuit' },
    { id: 'foret' as const, label: 'Forêt' }
  ];

  fontFamilies = ['Playfair Display', 'Lora', 'Georgia', 'Merriweather'];
  fontFamily = 'Playfair Display';
  fontSize = 19;
  lineHeight = 1.65;

  pageAnim: 'none' | 'fade' | 'slide' | 'cube' = 'fade';
  pageAnimOptions = [
    { id: 'none' as const, label: 'Aucune' },
    { id: 'fade' as const, label: 'Fondu' },
    { id: 'slide' as const, label: 'Glissement' },
    { id: 'cube' as const, label: 'Cube' }
  ];
  flipActive = false;

  toolTabs: { id: 'read' | 'notes' | 'marks' | 'quotes'; label: string }[] = [
    { id: 'read', label: 'Lecture' },
    { id: 'notes', label: 'Notes' },
    { id: 'marks', label: 'Surlignages' },
    { id: 'quotes', label: 'Citations' }
  ];
  activeToolTab: 'read' | 'notes' | 'marks' | 'quotes' = 'read';

  dictWord = 'anthologie';
  dictDef =
    'Recueil de textes choisis ; ici, récits du Grassfield réunis pour préserver la mémoire orale.';

  quickNote = '';
  notesCount = 12;
  bookmarksCount = 8;

  isPlaying = false;
  audioCurrent = 0;
  audioDuration = 9240;
  playbackRate = 1;
  private tick?: Subscription;
  private speechUtterance?: SpeechSynthesisUtterance;
  private ttsLines: string[] = [];
  private ttsIndex = 0;
  private ttsPaused = false;

  currentPage = 1;
  totalPages = 100;
  private pdfDocTotalPages = 0;
  private flipbookParagraphs: string[] = [];
  readingCount = 3;
  annualGoal = '24 / 35 livres · objectif annuel';
  readingHours = 'Temps de lecture · 134 h';

  private routeSub?: Subscription;
  private userSub?: Subscription;
  private userSnapshot: User | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookService: BookService,
    private cartService: CartService,
    private authService: AuthService,
    private fileService: FileService,
    private sanitizer: DomSanitizer,
    private communityService: CommunityService,
    private notificationService: NotificationService,
    private authIntent: AuthIntentService
  ) {}

  ngOnInit(): void {
    this.userSub = this.authService.currentUser$.subscribe(u => (this.userSnapshot = u));
    this.routeSub = this.route.paramMap
      .pipe(
        tap(() => {
          this.loading = true;
          this.book = undefined;
          // Important: quand on change de livre via “Sélection catalogue”, on purge le manuscrit précédent.
          this.manuscriptBusy = false;
          this.manuscriptError = null;
          this.revokeManuscriptUrl();
          this.pageFlipMode = false;
          this.spreadView = false;
          this.pdfSpreadStartPage = 1;
          this.pdfDocTotalPages = 0;
          this.flipbookParagraphs = [];
          this.stopSpeech();
          this.isPlaying = false;
        }),
        switchMap(params => {
          const id = params.get('id');
          if (!id) {
            return of<{ book: Book | undefined; list: Book[] }>({ book: undefined, list: [] });
          }
          return forkJoin({
            book: this.bookService.getBookById(id),
            list: this.bookService.getBooks(0, 8)
          });
        })
      )
      .subscribe(({ book, list }) => {
        this.loading = false;
        this.book = book;
        if (book) {
          let merged = list;
          if (!merged.find(x => x.id === book.id)) {
            merged = [book, ...merged].slice(0, 8);
          }
          this.libraryBooks = merged;
          this.chapterIndex = 1;
          this.pdfSpreadStartPage = 1;
          this.spreadView = false;
          this.leftToolPanel = null;
          this.searchQuery = '';
          this.syncMetaFromBook();
          this.buildChapterContent();
          this.preloadManuscript();
          this.loadLikeAndSubscriptionStatus();
        }
      });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.userSub?.unsubscribe();
    this.stopTick();
    this.stopSpeech();
    this.revokeManuscriptUrl();
  }

  get chapterLabel(): string {
    return `Chapitre ${this.chapterIndex} : ${this.chapterTitleExtra}`;
  }

  get chapterShort(): string {
    // Tant qu'on n'a pas de vraie table des matières côté API,
    // on évite d'afficher un “chapitrage” inventé en mode manuscrit.
    if (this.flipbookActive) return 'Manuscrit';
    return `Partie ${this.chapterIndex} / ${this.totalChapters}`;
  }

  get currentChapterTitle(): string {
    return this.tocEntries.find(t => t.index === this.chapterIndex)?.title || this.chapterTitleExtra;
  }

  /** Paragraphes filtrés par la recherche (mode extrait) */
  get paragraphsForRead(): string[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.chapterParagraphs;
    return this.chapterParagraphs.filter(p => p.toLowerCase().includes(q));
  }

  get isPdfManuscript(): boolean {
    return this.manuscriptMime === 'application/pdf' && !!this.manuscriptObjectUrl;
  }

  get manuscriptObjectUrlRaw(): string | null {
    return this.manuscriptObjectUrl;
  }

  get audioProgress(): number {
    if (!this.audioDuration) return 0;
    return Math.min(100, (this.audioCurrent / this.audioDuration) * 100);
  }

  get remainingLabel(): string {
    const rem = Math.max(0, this.audioDuration - this.audioCurrent);
    const m = Math.floor(rem / 60);
    const h = Math.floor(m / 60);
    const mm = m % 60;
    if (h > 0) return `${h} h ${mm} min restantes`;
    return `${mm} min restantes`;
  }

  formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const h = Math.floor(m / 60);
    const mm = m % 60;
    if (h > 0) return `${h}:${mm.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${mm}:${s.toString().padStart(2, '0')}`;
  }

  private syncMetaFromBook(): void {
    if (!this.book) return;
    const desc = this.book.description?.trim() || '';
    const words = desc.split(/\s+/).filter(Boolean).length;
    this.totalPages = Math.min(800, Math.max(32, Math.round(words / 280) + 32));
    this.totalChapters = Math.min(36, Math.max(4, Math.ceil(Math.max(words, 400) / 2200)));
    this.descriptionChunks = splitTextIntoChunks(desc, this.totalChapters);
    this.tocEntries = buildTocEntries(this.totalChapters, desc, this.book.title);
  }

  private buildChapterContent(): void {
    const filler = [
      'Les voix du marché s’éteignirent peu à peu ; il ne restait que le vent entre les collines et le froissement des pages qu’on tourne avec précaution, comme on ouvre une porte étroite vers un autre temps.',
      'Dans la pénombre de la case, le conteur fixa longtemps le motif du tapis — un labyrinthe stylisé — avant de poursuivre, plus bas, presque pour lui-même.'
    ];
    const idx = Math.min(Math.max(this.chapterIndex, 1), this.totalChapters) - 1;
    const raw =
      this.descriptionChunks[idx]?.trim() ||
      (this.book?.description?.trim() ? this.book.description.trim().slice(0, 1200) : '');
    const parts = raw ? raw.split(/\n+/).map(p => p.trim()).filter(Boolean) : [];
    this.chapterParagraphs = (parts.length ? parts : filler).slice(0, 14);
    this.highlightParagraphIndex = this.chapterParagraphs.length > 1 ? 1 : 0;
    this.chapterTitleExtra = this.tocEntries.find(t => t.index === this.chapterIndex)?.title || `Section ${this.chapterIndex}`;
    this.updatePageFromChapter();
    this.refreshChapterAudioDuration();
  }

  private updatePageFromChapter(): void {
    if (this.totalChapters <= 0) return;
    const span = this.totalPages / this.totalChapters;
    this.currentPage = Math.min(
      this.totalPages,
      Math.max(1, Math.round((this.chapterIndex - 1) * span) + 1)
    );
  }

  private refreshChapterAudioDuration(): void {
    const paragraphs = this.flipbookActive && this.flipbookParagraphs.length ? this.flipbookParagraphs : this.chapterParagraphs;
    const w = paragraphs.join(' ').split(/\s+/).filter(Boolean).length;
    this.audioDuration = Math.max(25, Math.round(w / 2.2));
    this.audioCurrent = 0;
  }

  /** URL iframe PDF avec #page (vue 1 ou 2 pages) */
  pdfFrameSrc(which: 'single' | 'left' | 'right'): SafeResourceUrl | null {
    if (!this.manuscriptObjectUrl) return this.manuscriptUrl;
    if (this.manuscriptMime !== 'application/pdf') return this.manuscriptUrl;
    let page = this.pdfSpreadStartPage;
    if (which === 'right') page += 1;
    const url = `${this.manuscriptObjectUrl}#page=${page}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  toggleLeftTool(panel: 'font' | 'toc' | 'search'): void {
    this.leftToolPanel = this.leftToolPanel === panel ? null : panel;
  }

  toggleSpreadView(): void {
    this.spreadView = !this.spreadView;
    this.leftToolPanel = null;
  }

  togglePageFlipMode(): void {
    this.pageFlipMode = !this.pageFlipMode;
    this.leftToolPanel = null;
  }

  private get flipbookActive(): boolean {
    return this.readMode === 'manuscript' && this.pageFlipMode && this.isPdfManuscript;
  }

  zoomFlip(delta: number): void {
    if (!this.flipbookActive) {
      this.adjustFont(delta);
      return;
    }
    if (delta > 0) this.flipbook?.zoomIn();
    else this.flipbook?.zoomOut();
  }

  onFlipPageChange(page: number): void {
    this.pdfSpreadStartPage = Math.max(1, Math.floor(page || 1));
    // Mappe la page PDF vers une partie/chapter via le total PDF si on l'a, sinon fallback.
    const denom = this.pdfDocTotalPages > 0 ? this.pdfDocTotalPages : this.totalPages;
    const approx = Math.max(
      1,
      Math.min(this.totalChapters, Math.ceil((this.pdfSpreadStartPage / Math.max(1, denom)) * this.totalChapters))
    );
    if (approx !== this.chapterIndex) {
      this.chapterIndex = approx;
      this.buildChapterContent();
    }
  }

  onFlipStateChange(ev: { startPage: number; totalPages: number; paragraphs: string[] }): void {
    this.pdfDocTotalPages = Math.max(1, Math.floor(ev.totalPages || 1));
    this.currentPage = Math.max(1, Math.floor(ev.startPage || 1));
    this.totalPages = this.pdfDocTotalPages;
    this.flipbookParagraphs = Array.isArray(ev.paragraphs) ? ev.paragraphs.filter(Boolean) : [];
    // Synchronise chapitre + durée audio à partir de la position réelle.
    this.onFlipPageChange(this.currentPage);
    this.refreshChapterAudioDuration();

    // Si l'audio est en cours, on resynchronise la lecture sur le nouveau texte.
    if (this.isPlaying) {
      this.startSpeech();
      this.isPlaying = true;
    }
  }

  cycleReaderTheme(): void {
    const ids = this.readerThemes.map(t => t.id);
    const i = ids.indexOf(this.readerTheme);
    this.readerTheme = ids[(i + 1) % ids.length];
  }

  selectTocChapter(i: number): void {
    if (i < 1 || i > this.totalChapters) return;
    this.chapterIndex = i;
    this.buildChapterContent();
    this.leftToolPanel = null;
    this.runPageAnim();
    // Si flipbook actif, navigue vers la page PDF correspondante (approx).
    if (this.flipbookActive) {
      const approxPage = Math.max(
        1,
        Math.round(((i - 1) / Math.max(1, this.totalChapters)) * this.totalPages) + 1
      );
      const pairStart = approxPage % 2 === 0 ? approxPage - 1 : approxPage;
      this.pdfSpreadStartPage = pairStart;
      void this.flipbook?.gotoPage(pairStart);
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  private preloadManuscript(): void {
    if (!this.book) return;
    if (!this.authService.isAuthenticated()) {
      // Pas de lecture du fichier sans auth (file-service protège le download ebook).
      this.readMode = 'excerpt';
      return;
    }
    this.loadManuscript();
  }

  loadManuscript(): void {
    if (!this.book) return;
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.manuscriptBusy = true;
    this.manuscriptError = null;
    this.revokeManuscriptUrl();
    this.fileService
      .downloadEbook(this.book.id)
      .pipe(
        tap(blob => {
          this.manuscriptMime = blob.type || null;
          const url = URL.createObjectURL(blob);
          this.manuscriptObjectUrl = url;
          const safe = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          // PDF: on affiche dans l'iframe. Autres formats: on propose un téléchargement.
          if (blob.type === 'application/pdf') {
            this.manuscriptUrl = safe;
            this.manuscriptDownloadUrl = null;
            this.readMode = 'manuscript';
          } else {
            this.manuscriptUrl = null;
            this.manuscriptDownloadUrl = safe;
            this.readMode = 'manuscript';
            this.manuscriptError =
              blob.type === 'application/epub+zip'
                ? "Ce livre est en EPUB : l'affichage intégré n'est pas encore supporté. Vous pouvez le télécharger."
                : "Format manuscrit non affichable ici. Vous pouvez le télécharger.";
          }
        }),
        catchError(() => {
          this.manuscriptError = 'Manuscrit indisponible (droits ou fichier manquant).';
          this.readMode = 'excerpt';
          return of(null);
        }),
        finalize(() => {
          this.manuscriptBusy = false;
        })
      )
      .subscribe();
  }

  private revokeManuscriptUrl(): void {
    if (this.manuscriptObjectUrl) {
      try {
        URL.revokeObjectURL(this.manuscriptObjectUrl);
      } catch {
        /* ignore */
      }
    }
    this.manuscriptObjectUrl = null;
    this.manuscriptUrl = null;
    this.manuscriptDownloadUrl = null;
    this.manuscriptMime = null;
  }

  goBack(): void {
    window.history.length > 1 ? history.back() : this.router.navigate(['/books']);
  }

  addToCart(): void {
    if (!this.book) return;
    if (!this.authService.isAuthenticated()) {
      this.authIntent.save(this.router.url, 'cart');
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    const fmt = this.book.format === 'physical' ? 'PHYSICAL' : 'EBOOK';
    this.cartBusy = true;
    this.cartService.add(this.book.id, 1, fmt).subscribe({
      next: () => {
        this.cartBusy = false;
      },
      error: () => {
        this.cartBusy = false;
      }
    });
  }

  toggleLike(): void {
    if (!this.book || this.likeBusy) return;
    if (!this.authService.isAuthenticated()) {
      this.authIntent.save(this.router.url, 'like');
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.likeBusy = true;
    const req$ = this.liked
      ? this.communityService.unlikeBook(this.book.id)
      : this.communityService.likeBook(this.book.id);
    req$.pipe(finalize(() => (this.likeBusy = false))).subscribe({
      next: () => (this.liked = !this.liked),
      error: () => {
        // fail silently in UI; user can retry
      },
    });
  }

  toggleBookSubscription(): void {
    if (!this.book || this.subscribeBusy) return;
    if (!this.authService.isAuthenticated()) {
      this.authIntent.save(this.router.url, 'subscribe');
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.subscribeBusy = true;
    const req$ = this.subscribedToAuthor
      ? this.notificationService.unsubscribeBook(this.book.id)
      : this.notificationService.subscribeBook(this.book.id);
    req$.pipe(finalize(() => (this.subscribeBusy = false))).subscribe({
      next: () => (this.subscribedToAuthor = !this.subscribedToAuthor),
      error: () => {
        /* ignore */
      },
    });
  }

  private loadLikeAndSubscriptionStatus(): void {
    if (!this.book) return;
    if (!this.authService.isAuthenticated()) {
      this.liked = false;
      this.subscribedToAuthor = false;
      return;
    }
    this.communityService.isBookLiked(this.book.id).subscribe({
      next: r => (this.liked = !!r.liked),
      error: () => (this.liked = false),
    });
    this.notificationService.isSubscribedToBook(this.book.id).subscribe({
      next: r => (this.subscribedToAuthor = !!r.subscribed),
      error: () => (this.subscribedToAuthor = false),
    });
  }

  adjustFont(delta: number): void {
    this.fontSize = Math.min(26, Math.max(14, this.fontSize + delta));
  }

  toggleNightInColumn(): void {
    this.cycleReaderTheme();
  }

  private stopSpeechIfPlaying(): void {
    if (this.isPlaying) {
      this.stopSpeech();
      this.isPlaying = false;
    }
  }

  togglePlay(): void {
    // Lecture audio fonctionnelle sans backend audio : speech synthesis sur le texte affiché.
    if (this.isPlaying) {
      this.pauseSpeech();
      this.isPlaying = false;
      return;
    }
    // Si on était en pause, on reprend sans repartir du début.
    if (this.ttsPaused) {
      this.resumeSpeech();
      this.ttsPaused = false;
      this.isPlaying = true;
      return;
    }
    this.startSpeech();
    this.isPlaying = true;
  }

  private stopTick(): void {
    this.tick?.unsubscribe();
    this.tick = undefined;
  }

  private startSpeech(): void {
    this.stopSpeech();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.isPlaying = false;
      return;
    }
    const paragraphs =
      this.flipbookActive && this.flipbookParagraphs.length ? this.flipbookParagraphs : this.chapterParagraphs;
    this.ttsLines = (paragraphs || []).map(p => (p || '').trim()).filter(Boolean);
    this.ttsIndex = 0;
    this.ttsPaused = false;
    this.speakTtsLine(this.ttsIndex);
  }

  private pauseSpeech(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.pause();
      this.ttsPaused = true;
    } catch {
      /* ignore */
    }
  }

  private resumeSpeech(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.resume();
    } catch {
      /* ignore */
    }
  }

  private stopSpeech(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    this.speechUtterance = undefined;
    this.ttsPaused = false;
    this.ttsLines = [];
    this.ttsIndex = 0;
  }

  seek(seconds: number): void {
    // En mode TTS, on interprète “avancer / rentrer” comme navigation “ligne/paragraphe”.
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && this.ttsLines.length) {
      if (seconds > 0) this.nextTtsLine();
      else if (seconds < 0) this.prevTtsLine();
      return;
    }
    // Fallback (si jamais pas de TTS) : garde le comportement “temps”.
    this.audioCurrent = Math.max(0, Math.min(this.audioDuration, this.audioCurrent + seconds));
  }

  private speakTtsLine(index: number): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const lines = this.ttsLines;
    if (!lines.length) return;
    const i = Math.max(0, Math.min(lines.length - 1, Math.floor(index)));
    this.ttsIndex = i;
    this.ttsPaused = false;

    try {
      // On repart de manière déterministe sur la ligne voulue.
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }

    const u = new SpeechSynthesisUtterance(lines[i]);
    u.rate = Math.max(0.6, Math.min(1.6, this.playbackRate));
    u.onend = () => {
      // Auto-enchaînement : lecture harmonisée, paragraphe par paragraphe.
      if (!this.isPlaying) return;
      if (this.ttsIndex + 1 < this.ttsLines.length) {
        this.speakTtsLine(this.ttsIndex + 1);
      } else {
        this.isPlaying = false;
      }
    };
    u.onerror = () => {
      this.isPlaying = false;
    };
    this.speechUtterance = u;
    window.speechSynthesis.speak(u);

    // UI: approx “position” (reste simple mais cohérent).
    this.audioCurrent = Math.min(this.audioDuration, Math.max(0, Math.round((i / Math.max(1, lines.length)) * this.audioDuration)));
  }

  private nextTtsLine(): void {
    if (!this.ttsLines.length) return;
    const next = Math.min(this.ttsLines.length - 1, this.ttsIndex + 1);
    this.isPlaying = true;
    this.speakTtsLine(next);
  }

  private prevTtsLine(): void {
    if (!this.ttsLines.length) return;
    const prev = Math.max(0, this.ttsIndex - 1);
    this.isPlaying = true;
    this.speakTtsLine(prev);
  }

  onSeekBar(ev: MouseEvent): void {
    const el = ev.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const pct = (ev.clientX - r.left) / r.width;
    if (this.ttsLines.length) {
      const targetIndex = Math.round(pct * (this.ttsLines.length - 1));
      const wasPlaying = this.isPlaying;
      this.isPlaying = true;
      this.speakTtsLine(targetIndex);
      if (!wasPlaying) {
        this.pauseSpeech();
        this.isPlaying = false;
      }
      return;
    }
    this.audioCurrent = pct * this.audioDuration;
  }

  saveQuickNote(): void {
    if (this.quickNote.trim()) {
      this.notesCount++;
      this.quickNote = '';
    }
  }

  nextChapter(): void {
    if (this.flipbookActive) {
      this.flipbook?.nextPair();
      return;
    }
    if (this.chapterIndex >= this.totalChapters) return;
    this.stopSpeechIfPlaying();
    this.chapterIndex++;
    if (this.isPdfManuscript) {
      this.pdfSpreadStartPage += this.spreadView ? 2 : 1;
    }
    this.runPageAnim();
    this.buildChapterContent();
  }

  prevChapter(): void {
    if (this.flipbookActive) {
      this.flipbook?.prevPair();
      return;
    }
    if (this.chapterIndex <= 1) return;
    this.stopSpeechIfPlaying();
    this.chapterIndex--;
    if (this.isPdfManuscript) {
      this.pdfSpreadStartPage = Math.max(
        1,
        this.pdfSpreadStartPage - (this.spreadView ? 2 : 1)
      );
    }
    this.runPageAnim();
    this.buildChapterContent();
  }

  private runPageAnim(): void {
    if (this.pageAnim === 'cube') {
      this.flipActive = true;
      setTimeout(() => (this.flipActive = false), 700);
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKey(ev: KeyboardEvent): void {
    if (ev.key === 'ArrowRight') this.nextChapter();
    if (ev.key === 'ArrowLeft') this.prevChapter();
  }

  @HostListener('document:mousedown', ['$event'])
  onDocMouseDown(ev: MouseEvent): void {
    if (!this.leftToolPanel) return;
    const t = ev.target as Node | null;
    if (!t) return;
    const toolbarEl = this.leftToolbar?.nativeElement;
    const panelEl = this.leftToolPanelEl?.nativeElement;
    const insideToolbar = !!toolbarEl && toolbarEl.contains(t);
    const insidePanel = !!panelEl && panelEl.contains(t);
    if (!insideToolbar && !insidePanel) {
      this.leftToolPanel = null;
    }
  }
}

function splitTextIntoChunks(text: string, n: number): string[] {
  const t = text.trim();
  if (n <= 0) return [];
  if (!t) return Array.from({ length: n }, () => '');
  const words = t.split(/\s+/).filter(Boolean);
  const per = Math.max(1, Math.ceil(words.length / n));
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.push(words.slice(i * per, (i + 1) * per).join(' '));
  }
  return out;
}

function buildTocEntries(
  n: number,
  desc: string,
  bookTitle: string
): { index: number; title: string }[] {
  const lines = desc
    .split(/\n+/)
    .map(l => l.trim())
    .filter(Boolean);
  const rows: { index: number; title: string }[] = [];
  for (let i = 0; i < n; i++) {
    let title = i === 0 ? `Introduction · ${bookTitle.slice(0, 42)}` : `Partie ${i + 1}`;
    const candidate = lines[i];
    if (candidate && candidate.length < 88 && !/^https?:\/\//i.test(candidate)) {
      title = candidate.replace(/^#+\s*/, '').slice(0, 80);
    }
    rows.push({ index: i + 1, title });
  }
  return rows;
}
