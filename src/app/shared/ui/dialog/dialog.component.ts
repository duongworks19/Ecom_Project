import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-dialog',
  standalone: true,
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogComponent implements OnDestroy {
  readonly open = input<boolean>(false);
  readonly title = input.required<string>();
  readonly dialogId = input<string>('vic-modal-dialog');
  readonly maxWidth = input<string>('520px');

  readonly closed = output<void>();

  @ViewChild('dialogPanel') dialogPanel?: ElementRef<HTMLElement>;

  private previousFocusedElement: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const isOpen = this.open();
      if (typeof document === 'undefined') {
        return;
      }
      if (isOpen) {
        this.previousFocusedElement = document.activeElement as HTMLElement | null;
        document.body.style.overflow = 'hidden';
        setTimeout(() => this.focusFirstElement(), 0);
      } else {
        this.restoreFocusAndScroll();
      }
    });
  }

  ngOnDestroy(): void {
    this.restoreFocusAndScroll();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
      return;
    }

    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  close(): void {
    this.closed.emit();
  }

  private focusFirstElement(): void {
    const panel = this.dialogPanel?.nativeElement;
    if (!panel) {
      return;
    }
    const focusables = this.getFocusableElements(panel);
    const firstInput = focusables.find(
      (el) => el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT'
    );
    if (firstInput) {
      firstInput.focus();
    } else if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      panel.focus();
    }
  }

  private trapFocus(event: KeyboardEvent): void {
    const panel = this.dialogPanel?.nativeElement;
    if (!panel) {
      return;
    }
    const focusables = this.getFocusableElements(panel);
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables.at(-1)!;
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(container.querySelectorAll<HTMLElement>(selector));
  }

  private restoreFocusAndScroll(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
    if (this.previousFocusedElement && typeof this.previousFocusedElement.focus === 'function') {
      const toFocus = this.previousFocusedElement;
      this.previousFocusedElement = null;
      setTimeout(() => toFocus.focus(), 0);
    }
  }
}
