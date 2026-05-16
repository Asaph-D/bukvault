import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const STORAGE_KEY = 'bv_reader_custom_lists_v1';

export interface ReaderCustomList {
  id: string;
  name: string;
  bookIds: string[];
  createdAt: string;
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

@Injectable({ providedIn: 'root' })
export class ReaderCustomListsService {
  private readonly subject = new BehaviorSubject<ReaderCustomList[]>(this.load());

  readonly lists$ = this.subject.asObservable();

  private load(): ReaderCustomList[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ReaderCustomList[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persist(lists: ReaderCustomList[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
    this.subject.next(lists);
  }

  snapshot(): ReaderCustomList[] {
    return [...this.subject.getValue()];
  }

  createList(name: string): ReaderCustomList {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Nom requis');
    }
    const list: ReaderCustomList = {
      id: genId(),
      name: trimmed,
      bookIds: [],
      createdAt: new Date().toISOString(),
    };
    const next = [list, ...this.snapshot()];
    this.persist(next);
    return list;
  }

  deleteList(id: string): void {
    this.persist(this.snapshot().filter(l => l.id !== id));
  }

  renameList(id: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this.persist(
      this.snapshot().map(l => (l.id === id ? { ...l, name: trimmed } : l)),
    );
  }

  addBook(listId: string, bookId: string): void {
    this.persist(
      this.snapshot().map(l => {
        if (l.id !== listId) return l;
        if (l.bookIds.includes(bookId)) return l;
        return { ...l, bookIds: [...l.bookIds, bookId] };
      }),
    );
  }

  removeBook(listId: string, bookId: string): void {
    this.persist(
      this.snapshot().map(l =>
        l.id !== listId ? l : { ...l, bookIds: l.bookIds.filter(b => b !== bookId) },
      ),
    );
  }
}
