import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { Steps } from 'primeng/steps';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { InputNumber } from 'primeng/inputnumber';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Message } from 'primeng/message';
import { Divider } from 'primeng/divider';
import { DashboardInternalHeaderComponent } from '../../shared/dashboard-internal-header.component';
import { BookCategory } from '../../../../models/book.model';
import { AuthService } from '../../../../services/auth.service';
import { BookService } from '../../../../services/book.service';
import { FileService } from '../../../../services/file.service';
import { environment } from '../../../../../environments/environment';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-author-upload-page',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    Steps,
    Card,
    Button,
    Select,
    InputText,
    Textarea,
    InputNumber,
    ToggleSwitch,
    Message,
    Divider,
    DashboardInternalHeaderComponent,
  ],
  templateUrl: './author-upload-page.component.html',
})
export class AuthorUploadPageComponent implements OnInit {
  private static readonly DRAFT_KEY = 'bookvault-author-upload-draft-v1';

  activeStep = 0;

  @ViewChild('ebookInput') ebookInput?: ElementRef<HTMLInputElement>;
  @ViewChild('coverInput') coverInput?: ElementRef<HTMLInputElement>;

  wizardSteps: MenuItem[] = [
    { label: 'Fiche livre', icon: 'pi pi-book' },
    { label: 'Manuscrit', icon: 'pi pi-file' },
    { label: 'Couverture', icon: 'pi pi-image' },
    { label: 'Offre & droits', icon: 'pi pi-tag' },
    { label: 'Récapitulatif', icon: 'pi pi-check-circle' },
  ];

  genreOptions = [
    { label: 'Fantasy', value: 'fantasy' },
    { label: 'Science-fiction', value: 'sf' },
    { label: 'Romance', value: 'romance' },
    { label: 'Thriller', value: 'thriller' },
    { label: 'Essai / non-fiction', value: 'nonfiction' },
  ];

  langOptions = [
    { label: 'Français', value: 'fr' },
    { label: 'English', value: 'en' },
    { label: 'Español', value: 'es' },
  ];

  priceTierOptions = [
    { label: 'Gratuit', value: 'free' },
    { label: 'Standard (4,99 €)', value: 'standard' },
    { label: 'Premium (9,99 €)', value: 'premium' },
  ];

  categories: BookCategory[] = [];
  categoriesLoading = true;
  categoriesError: string | null = null;

  publishing = false;
  publishError: string | null = null;
  publishSuccessBookId: string | null = null;
  createdBookId: string | null = null;

  ebookFile: File | null = null;
  coverFile: File | null = null;
  fileSelectionNotice: string | null = null;
  ebookPreviewUrl: SafeResourceUrl | null = null;
  coverPreviewUrl: string | null = null;
  dragEbook = false;
  dragCover = false;

  draft = {
    title: '',
    subtitle: '',
    genre: null as string | null,
    language: 'fr',
    synopsis: '',
    seriesName: '',
    isbn: '',
    categoryId: null as string | null,
    manuscriptFileName: null as string | null,
    coverFileName: null as string | null,
    priceTier: 'standard',
    exclusive: true,
    chapterSampleCount: 3,
  };

  constructor(
    private auth: AuthService,
    private books: BookService,
    private files: FileService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.restoreDraft();

    this.books.getCategories().subscribe({
      next: list => {
        this.categories = list;
        this.categoriesLoading = false;
      },
      error: () => {
        this.categoriesError = 'Impossible de charger les catégories.';
        this.categoriesLoading = false;
      },
    });
  }

  private saveDraft(): void {
    try {
      const payload = {
        activeStep: this.activeStep,
        createdBookId: this.createdBookId,
        draft: this.draft,
      };
      localStorage.setItem(AuthorUploadPageComponent.DRAFT_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }

  private restoreDraft(): void {
    try {
      const raw = localStorage.getItem(AuthorUploadPageComponent.DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        activeStep?: number;
        createdBookId?: string | null;
        draft?: Partial<{
          title: string;
          subtitle: string;
          genre: string | null;
          language: string;
          synopsis: string;
          seriesName: string;
          isbn: string;
          categoryId: string | null;
          manuscriptFileName: string | null;
          coverFileName: string | null;
          priceTier: string;
          exclusive: boolean;
          chapterSampleCount: number;
        }>;
      };
      if (typeof parsed.activeStep === 'number') this.activeStep = parsed.activeStep;
      if (typeof parsed.createdBookId === 'string') this.createdBookId = parsed.createdBookId;
      if (parsed.draft && typeof parsed.draft === 'object') {
        this.draft = { ...this.draft, ...parsed.draft };
      }
      if (this.createdBookId) {
        this.fileSelectionNotice =
          'Brouillon restauré. Après un refresh, re-sélectionnez le manuscrit et la jaquette (les fichiers ne peuvent pas être stockés en navigateur).';
      }
    } catch {
      /* ignore */
    }
  }

  private clearDraftLocal(): void {
    try {
      localStorage.removeItem(AuthorUploadPageComponent.DRAFT_KEY);
    } catch {
      /* ignore */
    }
  }

  clearManuscript(): void {
    this.draft.manuscriptFileName = null;
    this.ebookFile = null;
    this.revokeEbookPreview();
    this.saveDraft();
  }

  clearCover(): void {
    this.draft.coverFileName = null;
    this.coverFile = null;
    this.revokeCoverPreview();
    this.saveDraft();
  }

  chooseEbook(): void {
    this.ebookInput?.nativeElement.click();
  }

  chooseCover(): void {
    this.coverInput?.nativeElement.click();
  }

  onEbookSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const f = input.files && input.files[0];
    if (!f) return;
    this.setEbookFile(f);
    this.saveDraft();
  }

  onCoverSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const f = input.files && input.files[0];
    if (!f) return;
    this.setCoverFile(f);
    this.saveDraft();
  }

  onDragOverEbook(ev: DragEvent): void {
    ev.preventDefault();
    this.dragEbook = true;
  }

  onDragLeaveEbook(): void {
    this.dragEbook = false;
  }

  onDropEbook(ev: DragEvent): void {
    ev.preventDefault();
    this.dragEbook = false;
    const f = ev.dataTransfer?.files?.[0];
    if (!f) return;
    this.setEbookFile(f);
    this.saveDraft();
  }

  onDragOverCover(ev: DragEvent): void {
    ev.preventDefault();
    this.dragCover = true;
  }

  onDragLeaveCover(): void {
    this.dragCover = false;
  }

  onDropCover(ev: DragEvent): void {
    ev.preventDefault();
    this.dragCover = false;
    const f = ev.dataTransfer?.files?.[0];
    if (!f) return;
    this.setCoverFile(f);
    this.saveDraft();
  }

  private setEbookFile(f: File): void {
    this.ebookFile = f;
    this.draft.manuscriptFileName = f.name;
    this.fileSelectionNotice = null;
    this.revokeEbookPreview();
    if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
      const url = URL.createObjectURL(f);
      this.ebookPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    } else {
      this.ebookPreviewUrl = null;
    }
  }

  private setCoverFile(f: File): void {
    this.coverFile = f;
    this.draft.coverFileName = f.name;
    this.fileSelectionNotice = null;
    this.revokeCoverPreview();
    const url = URL.createObjectURL(f);
    this.coverPreviewUrl = url;
  }

  private revokeEbookPreview(): void {
    // SafeResourceUrl wraps the original string, we can't reliably extract it; just null out.
    // The browser will GC object URLs when page is closed; we keep it simple here.
    this.ebookPreviewUrl = null;
  }

  private revokeCoverPreview(): void {
    if (this.coverPreviewUrl) {
      try {
        URL.revokeObjectURL(this.coverPreviewUrl);
      } catch {
        /* ignore */
      }
    }
    this.coverPreviewUrl = null;
  }

  private priceFromTier(tier: string): number {
    if (tier === 'free') return 0;
    if (tier === 'premium') return 9.99;
    return 4.99;
  }

  private ensureIsbn(): string {
    const v = (this.draft.isbn || '').trim();
    if (v) return v.slice(0, 32);
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
    return `BV-${stamp}`.slice(0, 32);
  }

  /** Orchestration robuste : create -> upload ebook/cover -> update coverUrl -> publish. */
  publish(): void {
    this.publishError = null;
    this.publishSuccessBookId = null;

    const u = this.auth.getCurrentUser();
    if (!u || u.role !== 'author') {
      this.publishError = 'Vous devez être connecté avec un compte auteur.';
      return;
    }
    if (!this.draft.title.trim()) {
      this.publishError = 'Titre requis.';
      this.activeStep = 0;
      return;
    }
    if (!this.draft.categoryId) {
      this.publishError = 'Catégorie requise.';
      this.activeStep = 0;
      return;
    }
    if (!this.ebookFile) {
      this.publishError = 'Manuscrit requis (PDF/EPUB/MOBI).';
      this.activeStep = 1;
      return;
    }
    if (!this.coverFile) {
      this.publishError = 'Couverture requise (JPEG/PNG/WebP).';
      this.activeStep = 2;
      return;
    }

    const isbn = this.ensureIsbn();
    const title = this.draft.subtitle?.trim()
      ? `${this.draft.title.trim()} — ${this.draft.subtitle.trim()}`
      : this.draft.title.trim();
    const descriptionParts = [
      this.draft.synopsis?.trim() || '',
      this.draft.seriesName?.trim() ? `Série : ${this.draft.seriesName.trim()}` : '',
      this.draft.genre ? `Genre (UI) : ${this.draft.genre}` : '',
    ].filter(Boolean);
    const description = descriptionParts.join('\n\n');
    const price = this.priceFromTier(this.draft.priceTier);

    this.publishing = true;

    const create$ = this.createdBookId
      ? of(this.createdBookId)
      : this.books.createBook({
          isbn,
          title,
          description,
          price,
          language: this.draft.language,
          format: 'EBOOK',
          categoryIds: [this.draft.categoryId],
          coverUrl: null,
          authorUserId: null,
        }).pipe(
          switchMap(d => {
            this.createdBookId = d.id;
            this.saveDraft();
            return of(d.id);
          })
        );

    create$
      .pipe(
        switchMap(bookId =>
          this.files.uploadEbook(bookId, this.ebookFile!).pipe(
            switchMap(() => this.files.uploadCover(bookId, this.coverFile!)),
            switchMap(() =>
              this.books.updateBookRaw(bookId, {
                isbn,
                title,
                description,
                price,
                language: this.draft.language,
                format: 'EBOOK',
                categoryIds: [this.draft.categoryId!],
                coverUrl: `${environment.apiUrl}/files/cover/${bookId}`,
              })
            ),
            switchMap(() => this.books.submitForReview(bookId)),
            switchMap(() => of(bookId))
          )
        ),
        catchError(err => {
          // Stratégie anti-failure : conserver createdBookId pour retry sans recréer.
          const msg = err?.message || 'Échec lors de la publication.';
          this.publishError = msg;
          return of(null);
        }),
        finalize(() => {
          this.publishing = false;
        })
      )
      .subscribe(resultId => {
        if (!resultId) return;
        this.publishSuccessBookId = resultId;
        this.activeStep = 4;
        this.saveDraft();
      });
  }

  /** Rollback contrôlé : supprime le brouillon côté API + purge le localStorage. */
  deleteDraft(): void {
    this.publishError = null;
    this.publishSuccessBookId = null;
    this.fileSelectionNotice = null;

    const id = this.createdBookId;
    if (!id) {
      this.clearDraftLocal();
      return;
    }
    this.publishing = true;
    this.books
      .deleteBookRaw(id)
      .pipe(
        catchError(() => of(null)),
        finalize(() => {
          this.publishing = false;
        })
      )
      .subscribe(() => {
        this.createdBookId = null;
        this.ebookFile = null;
        this.coverFile = null;
        this.draft = {
          title: '',
          subtitle: '',
          genre: null as string | null,
          language: 'fr',
          synopsis: '',
          seriesName: '',
          isbn: '',
          categoryId: null as string | null,
          manuscriptFileName: null as string | null,
          coverFileName: null as string | null,
          priceTier: 'standard',
          exclusive: true,
          chapterSampleCount: 3,
        };
        this.activeStep = 0;
        this.clearDraftLocal();
      });
  }

  next(): void {
    this.activeStep = Math.min(this.wizardSteps.length - 1, this.activeStep + 1);
    this.saveDraft();
  }

  prev(): void {
    this.activeStep = Math.max(0, this.activeStep - 1);
    this.saveDraft();
  }

  goTo(i: number): void {
    if (i >= 0 && i < this.wizardSteps.length) {
      this.activeStep = i;
      this.saveDraft();
    }
  }
}
