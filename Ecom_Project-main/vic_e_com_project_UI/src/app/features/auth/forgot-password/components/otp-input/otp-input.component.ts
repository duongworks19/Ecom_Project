import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChildren,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-otp-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './otp-input.component.html',
  styleUrl: './otp-input.component.scss',
})
export class OtpInputComponent implements AfterViewInit {
  @Input() disabled = false;
  @Input() hasError = false;
  @Output() otpChange = new EventEmitter<string>();
  @Output() otpComplete = new EventEmitter<string>();

  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly indices = [0, 1, 2, 3, 4, 5];
  readonly digits = signal<string[]>(['', '', '', '', '', '']);

  ngAfterViewInit(): void {
    setTimeout(() => this.focusBox(0), 50);
  }

  onInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '');

    if (!raw) {
      this.setDigit(index, '');
      input.value = '';
      return;
    }

    // Nếu người dùng gõ hoặc autofill nhiều số vào 1 ô
    if (raw.length > 1) {
      this.distributeDigits(index, raw);
      return;
    }

    const char = raw.slice(-1);
    this.setDigit(index, char);
    input.value = char;

    if (index < 5) {
      this.focusBox(index + 1);
    }
  }

  onKeyDown(index: number, event: KeyboardEvent): void {
    if (this.disabled) return;

    const currentDigits = this.digits();

    if (event.key === 'Backspace') {
      event.preventDefault();
      if (currentDigits[index]) {
        this.setDigit(index, '');
        this.syncDomValue(index, '');
      } else if (index > 0) {
        this.setDigit(index - 1, '');
        this.syncDomValue(index - 1, '');
        this.focusBox(index - 1);
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusBox(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      this.focusBox(index + 1);
      return;
    }

    // Chặn các phím không phải chữ số (trừ phím điều khiển / tổ hợp phím tắt)
    if (
      event.key.length === 1 &&
      !/^\d$/.test(event.key) &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent): void {
    if (this.disabled) return;
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const numeric = pasted.replace(/\D/g, '').slice(0, 6);
    if (!numeric) return;

    this.distributeDigits(0, numeric);
  }

  onFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  clear(): void {
    this.digits.set(['', '', '', '', '', '']);
    this.digitInputs?.forEach((ref) => {
      ref.nativeElement.value = '';
    });
    this.otpChange.emit('');
    this.focusBox(0);
  }

  private distributeDigits(startIndex: number, numericStr: string): void {
    const next = [...this.digits()];
    let cursor = startIndex;

    for (const ch of numericStr) {
      if (cursor > 5) break;
      next[cursor] = ch;
      this.syncDomValue(cursor, ch);
      cursor++;
    }

    this.digits.set(next);
    this.emitValue(next);

    const nextFocusIndex = Math.min(cursor, 5);
    this.focusBox(nextFocusIndex);
  }

  private setDigit(index: number, char: string): void {
    const next = [...this.digits()];
    next[index] = char;
    this.digits.set(next);
    this.emitValue(next);
  }

  private emitValue(arr: string[]): void {
    const code = arr.join('');
    this.otpChange.emit(code);
    if (code.length === 6 && /^\d{6}$/.test(code)) {
      this.otpComplete.emit(code);
    }
  }

  private syncDomValue(index: number, val: string): void {
    const ref = this.digitInputs?.get(index);
    if (ref) {
      ref.nativeElement.value = val;
    }
  }

  private focusBox(index: number): void {
    const ref = this.digitInputs?.get(index);
    if (ref) {
      ref.nativeElement.focus();
      ref.nativeElement.select();
    }
  }
}
