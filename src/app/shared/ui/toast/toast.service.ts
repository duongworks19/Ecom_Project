import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastPayload {
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  readonly toast = signal<ToastPayload | null>(null);
  private timerId: ReturnType<typeof setTimeout> | null = null;

  show(message: string, type: ToastType = 'info', durationMs = 3200): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
    this.toast.set({ message, type });
    this.timerId = setTimeout(() => {
      this.toast.set(null);
      this.timerId = null;
    }, durationMs);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  dismiss(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.toast.set(null);
  }
}
