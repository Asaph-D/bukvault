import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class UiToastService {
  constructor(private messages: MessageService) {}

  success(summary: string, detail?: string): void {
    this.messages.add({ severity: 'success', summary, detail });
  }

  info(summary: string, detail?: string): void {
    this.messages.add({ severity: 'info', summary, detail });
  }

  warn(summary: string, detail?: string): void {
    this.messages.add({ severity: 'warn', summary, detail });
  }

  error(summary: string, detail?: string): void {
    this.messages.add({ severity: 'error', summary, detail });
  }
}

