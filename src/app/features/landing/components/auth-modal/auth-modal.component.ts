import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-modal.component.html',
  styleUrl: './auth-modal.component.scss',
})
export class AuthModalComponent {
  @Input() initialMode: 'login' | 'register' = 'register';
  @Output() closeModal = new EventEmitter<void>();
  @Output() authSuccess = new EventEmitter<{ mode: string; email: string }>();

  readonly mode = signal<'login' | 'register'>('register');
  readonly email = signal<string>('');
  readonly password = signal<string>('');
  readonly fullName = signal<string>('');
  readonly termsAgreed = signal<boolean>(true);

  ngOnInit() {
    this.mode.set(this.initialMode);
  }

  setMode(newMode: 'login' | 'register') {
    this.mode.set(newMode);
  }

  onClose() {
    this.closeModal.emit();
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.email()) return;

    this.authSuccess.emit({
      mode: this.mode(),
      email: this.email(),
    });
    this.onClose();
  }
}
