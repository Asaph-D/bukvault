import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SelectedBookService {
  private selectedBookIdSubject = new BehaviorSubject<string | null>(null);
  public selectedBookId$ = this.selectedBookIdSubject.asObservable();

  selectBook(bookId: string): void {
    this.selectedBookIdSubject.next(bookId);
  }

  clearSelection(): void {
    this.selectedBookIdSubject.next(null);
  }

  getSelectedBookId(): string | null {
    return this.selectedBookIdSubject.value;
  }
}
