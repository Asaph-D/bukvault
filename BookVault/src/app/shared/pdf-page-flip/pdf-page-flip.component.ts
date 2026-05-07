import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    NgZone,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChanges,
    ViewChild,
} from '@angular/core';

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

function ensurePromiseTry(): void {
  const P: any = Promise as any;
  if (typeof P.try === 'function') return;
  P.try = (fn: () => any) =>
    new Promise((resolve, reject) => {
      try {
        resolve(fn());
      } catch (e) {
        reject(e);
      }
    });
}

@Component({
  selector: 'app-pdf-page-flip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-page-flip.component.html',
  styleUrls: ['./pdf-page-flip.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfPageFlipComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('leftCanvas', { static: true }) leftCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rightCanvas', { static: true }) rightCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('flipCanvasFront', { static: true }) flipCanvasFront!: ElementRef<HTMLCanvasElement>;
  @ViewChild('flipCanvasBack', { static: true }) flipCanvasBack!: ElementRef<HTMLCanvasElement>;

  /** ObjectURL du PDF (ex: blob:...) */
  @Input({ required: true }) src!: string;
  /** Page de démarrage (1-indexed) */
  @Input() startPage = 1;
  /** Scale logique (la netteté vient du DPR) */
  @Input() scale = 1.15;
  /** Sur-échantillonnage pour netteté maximale (coût CPU/RAM) */
  @Input() sharpness = 1.6;
  /** Thème de lecture appliqué au fond/filtre */
  @Input() readerTheme: 'aube' | 'nuit' | 'sepia' | 'foret' = 'nuit';

  /** Début de paire actuellement affichée (1-indexed) */
  @Output() pageChange = new EventEmitter<number>();
  /** Remonte page courante + total pages + texte (pour lecteur audio) */
  @Output() stateChange = new EventEmitter<{
    startPage: number;
    totalPages: number;
    paragraphs: string[];
  }>();

  loading = true;
  error: string | null = null;
  progressiveLoading = false;
  progressPct = 0;
  progressLabel = '';

  busy = false;
  flipping = false;
  flipDirection: 'next' | 'prev' = 'next';
  currentPairStart = 1;
  totalPagesInDoc = 1;
  zoom = 1.0;

  private abort = false;
  private doc?: any;
  private cache = new Map<number, HTMLCanvasElement>();
  private textCache = new Map<number, string>();
  private debugRunId = 0;

  constructor(private zone: NgZone, private cdr: ChangeDetectorRef) {
    ensurePromiseTry();
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  }

  ngAfterViewInit(): void {
    void this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] && !changes['src'].firstChange) {
      void this.load();
      return;
    }
    if (changes['startPage'] && !changes['startPage'].firstChange) {
      void this.gotoPage(this.startPage);
    }
  }

  ngOnDestroy(): void {
    this.abort = true;
    this.doc = undefined;
    this.cache.clear();
    this.textCache.clear();
  }

  private log(msg: string, extra?: Record<string, unknown>): void {
    const id = this.debugRunId;
    const base = `[pdf-flip#${id}] ${msg}`;
    if (extra) console.log(base, extra);
    else console.log(base);
  }

  private setProgress(pct: number, label: string): void {
    this.progressPct = Math.max(0, Math.min(100, Math.round(pct)));
    this.progressLabel = label;
    this.cdr.markForCheck();
  }

  zoomIn(): void {
    this.zoom = Math.min(2.0, Math.round((this.zoom + 0.1) * 10) / 10);
    void this.paintCurrentPair();
  }

  zoomOut(): void {
    this.zoom = Math.max(0.7, Math.round((this.zoom - 0.1) * 10) / 10);
    void this.paintCurrentPair();
  }

  async gotoPage(page: number): Promise<void> {
    const p = Math.max(1, Math.floor(page || 1));
    this.currentPairStart = p % 2 === 0 ? p - 1 : p;
    await this.ensurePairRendered(this.currentPairStart);
    await this.paintCurrentPair();
  }

  onBookClick(ev: MouseEvent): void {
    const el = ev.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const x = ev.clientX - r.left;
    if (x < r.width / 2) this.prevPair();
    else this.nextPair();
  }

  nextPair(): void {
    if (this.busy || this.flipping) return;
    if (this.currentPairStart + 2 > this.totalPagesInDoc) return;
    void this.flipTo('next');
  }

  prevPair(): void {
    if (this.busy || this.flipping) return;
    if (this.currentPairStart <= 1) return;
    void this.flipTo('prev');
  }

  private async load(): Promise<void> {
    if (!this.src) return;
    this.abort = false;
    this.debugRunId++;
    this.loading = true;
    this.error = null;
    this.progressiveLoading = false;
    this.cache.clear();
    this.cdr.markForCheck();

    try {
      this.setProgress(0, 'chargement PDF');
      this.log('getDocument()…');
      const loadingTask = (pdfjsLib as any).getDocument({
        url: this.src,
        disableWorker: true,
      });
      const doc = await loadingTask.promise;
      if (this.abort) return;
      this.doc = doc;
      this.totalPagesInDoc = doc.numPages || 1;
      this.log('getDocument() OK', { numPages: this.totalPagesInDoc });

      await this.gotoPage(this.startPage);

      this.loading = false;
      this.progressiveLoading = true;
      this.cdr.markForCheck();

      void this.ensurePairRendered(this.currentPairStart + 2).finally(() => {
        this.progressiveLoading = false;
        this.cdr.markForCheck();
      });
    } catch (e: any) {
      this.loading = false;
      this.error = 'Impossible de rendre le PDF en mode feuilletage.';
      this.log('load() ERROR', { error: String(e?.message || e) });
      this.cdr.markForCheck();
    }
  }

  private async ensurePairRendered(pairStart: number): Promise<void> {
    if (!this.doc) return;
    const start = Math.max(1, pairStart % 2 === 0 ? pairStart - 1 : pairStart);
    const right = Math.min(this.totalPagesInDoc, start + 1);
    const pages = [start, right];

    let done = 0;
    this.setProgress(0, `rendu paire p.${start}-${right}`);
    for (const p of pages) {
      if (this.abort) return;
      if (this.cache.has(p)) {
        done++;
        this.setProgress((done / pages.length) * 100, `rendu paire p.${start}-${right}`);
        continue;
      }

      this.log('render page start', { page: p });
      const page = await this.doc.getPage(p);
      // Netteté maximale: on sur-échantillonne le rendu PDF.
      // Attention: plus haut => plus lourd (RAM/CPU).
      const dpr = Math.max(1, Math.min(5, window.devicePixelRatio || 1));
      const supersample = Math.max(1, Math.min(2.4, this.sharpness));
      const viewport = page.getViewport({ scale: this.scale * dpr * supersample });

      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');
      if (!ctx) continue;
      c.width = Math.floor(viewport.width);
      c.height = Math.floor(viewport.height);

      await page.render({ canvasContext: ctx, viewport, canvas: c }).promise;
      this.cache.set(p, c);
      this.log('render page done', { page: p, w: c.width, h: c.height });

      done++;
      this.setProgress((done / pages.length) * 100, `rendu paire p.${start}-${right}`);
    }
  }

  private async paintCurrentPair(): Promise<void> {
    const start = this.currentPairStart;
    const leftP = start;
    const rightP = Math.min(this.totalPagesInDoc, start + 1);

    this.busy = true;
    this.cdr.markForCheck();

    // Laisse le layout se stabiliser (sinon canvas peut mesurer 0x0 et rien ne s'affiche).
    await new Promise<void>(r => requestAnimationFrame(() => r()));

    await this.paintCanvas(this.leftCanvas.nativeElement, this.cache.get(leftP) || null);
    await this.paintCanvas(this.rightCanvas.nativeElement, this.cache.get(rightP) || null);

    this.busy = false;
    this.cdr.markForCheck();

    this.zone.run(() => this.pageChange.emit(start));

    // Texte pour le lecteur audio (extrait du PDF). Après paint pour ne pas bloquer l'affichage.
    void this.emitStateForPair(start).catch(() => {
      /* ignore */
    });
  }

  private async emitStateForPair(start: number): Promise<void> {
    if (!this.doc) return;
    const leftP = start;
    const rightP = Math.min(this.totalPagesInDoc, start + 1);
    const [t1, t2] = await Promise.all([
      this.getPageText(leftP),
      rightP !== leftP ? this.getPageText(rightP) : Promise.resolve(''),
    ]);
    const merged = [t1, t2].filter(Boolean).join('\n\n');
    const paragraphs = this.splitToParagraphs(merged);
    this.zone.run(() =>
      this.stateChange.emit({
        startPage: start,
        totalPages: this.totalPagesInDoc,
        paragraphs,
      })
    );
  }

  private async getPageText(pageNumber: number): Promise<string> {
    if (!this.doc) return '';
    if (this.textCache.has(pageNumber)) return this.textCache.get(pageNumber) || '';
    try {
      const page = await this.doc.getPage(pageNumber);
      const tc = await page.getTextContent();
      const raw = (tc?.items || [])
        .map((it: any) => String(it?.str || '').trim())
        .filter(Boolean)
        .join(' ');
      const text = raw.replace(/\s+/g, ' ').trim();
      this.textCache.set(pageNumber, text);
      return text;
    } catch {
      return '';
    }
  }

  private splitToParagraphs(text: string): string[] {
    const t = (text || '').trim();
    if (!t) return [];
    // Découpe “lecture” (évite des utterances trop longues et garde un rythme naturel).
    const maxLen = 700;
    const out: string[] = [];
    let buf = '';
    for (const sentence of t.split(/(?<=[.!?])\s+/g)) {
      const s = sentence.trim();
      if (!s) continue;
      if ((buf + ' ' + s).trim().length > maxLen && buf.trim()) {
        out.push(buf.trim());
        buf = s;
      } else {
        buf = (buf ? buf + ' ' : '') + s;
      }
    }
    if (buf.trim()) out.push(buf.trim());
    return out.slice(0, 18);
  }

  private async paintCanvas(target: HTMLCanvasElement, src: HTMLCanvasElement | null): Promise<void> {
    const ctx = target.getContext('2d');
    if (!ctx) return;
    const r = target.getBoundingClientRect();
    let w = Math.floor(r.width);
    let h = Math.floor(r.height);
    if (w < 2 || h < 2) {
      const parent = target.parentElement;
      if (parent) {
        const pr = parent.getBoundingClientRect();
        w = Math.floor(pr.width);
        h = Math.floor(pr.height);
      }
    }
    w = Math.max(1, w);
    h = Math.max(1, h);
    const dpr = Math.max(1, Math.min(5, window.devicePixelRatio || 1));
    // Canvas HiDPI: on rend à (CSS * DPR) pour une meilleure netteté.
    target.width = Math.floor(w * dpr);
    target.height = Math.floor(h * dpr);
    // On dessine en coordonnées CSS.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!src) return;

    const sw = src.width;
    const sh = src.height;
    // Zoom: on augmente la “taille” du contenu, puis on centre.
    const s = Math.min(w / sw, h / sh) * this.zoom;
    const dw = Math.floor(sw * s);
    const dh = Math.floor(sh * s);
    const dx = Math.floor((w - dw) / 2);
    const dy = Math.floor((h - dh) / 2);

    // Pour le texte, le sur-échantillonnage côté PDF apporte le plus.
    // On laisse un lissage élevé lors du downscale.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, dx, dy, dw, dh);

    // Debug: si jamais on peint encore sur une surface minuscule, on log.
    if (w < 10 || h < 10) {
      this.log('paintCanvas tiny target', { w, h });
    }
  }

  private async flipTo(dir: 'next' | 'prev'): Promise<void> {
    if (this.flipping) return;
    this.flipDirection = dir;
    const destStart = dir === 'next' ? this.currentPairStart + 2 : this.currentPairStart - 2;
    if (destStart < 1 || destStart > this.totalPagesInDoc) return;

    this.flipping = true;
    this.progressiveLoading = true;
    this.cdr.markForCheck();

    // 1) Rend d’abord la paire cible : la transition doit montrer le spread suivant / précédent,
    //    pas une copie des pages encore affichées derrière.
    await this.ensurePairRendered(destStart);

    // 2) Pendant le flip, une seule colonne passe au spread cible : l’autre garde la page
    //    du spread courant (évite qu’une page paire / impaire “reçoive” un contenu dupliqué
    //    ou incohérent avec la feuille qui tourne).
    //    Suivant — gauche = déjà la page impaire du spread suivant ; droite = encore la page paire actuelle.
    //    Précédent — droite = déjà la page paire du spread précédent ; gauche = encore la page impaire actuelle.
    const curLeft = this.currentPairStart;
    const curRight = Math.min(this.totalPagesInDoc, this.currentPairStart + 1);
    const destLeft = destStart;
    const destRight = Math.min(this.totalPagesInDoc, destStart + 1);
    await new Promise<void>(r => requestAnimationFrame(() => r()));
    if (dir === 'next') {
      await this.paintCanvas(this.leftCanvas.nativeElement, this.cache.get(destLeft) || null);
      await this.paintCanvas(this.rightCanvas.nativeElement, this.cache.get(curRight) || null);
    } else {
      await this.paintCanvas(this.leftCanvas.nativeElement, this.cache.get(curLeft) || null);
      await this.paintCanvas(this.rightCanvas.nativeElement, this.cache.get(destRight) || null);
    }

    // 3) Double face de la feuille qui quitte le spread :
    //    suivant — recto = page droite actuelle ; verso = page gauche du spread suivante.
    //    précédent — recto = page droite du spread précédent ; verso = page gauche actuelle.
    let frontPage: number;
    let backPage: number;
    if (dir === 'next') {
      frontPage = Math.min(this.totalPagesInDoc, this.currentPairStart + 1);
      backPage = destStart;
    } else {
      const rPrev = Math.min(this.totalPagesInDoc, destStart + 1);
      frontPage = rPrev > destStart ? rPrev : destStart;
      backPage = this.currentPairStart;
    }
    await this.paintCanvas(this.flipCanvasFront.nativeElement, this.cache.get(frontPage) || null);
    await this.paintCanvas(this.flipCanvasBack.nativeElement, this.cache.get(backPage) || null);
    await new Promise<void>(r => requestAnimationFrame(() => r()));

    await new Promise(r => setTimeout(r, 540));

    this.currentPairStart = destStart;
    await this.paintCurrentPair();

    this.flipping = false;
    this.progressiveLoading = false;
    this.cdr.markForCheck();

    const preload = dir === 'next' ? this.currentPairStart + 2 : this.currentPairStart - 2;
    void this.ensurePairRendered(preload);
  }
}

