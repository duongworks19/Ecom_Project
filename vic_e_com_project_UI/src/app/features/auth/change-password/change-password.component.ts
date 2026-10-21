import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { PasswordFormComponent } from '../../../shared/ui/password-form/password-form.component';

@Component({
  selector: 'vic-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PasswordFormComponent],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss',
})
export class ChangePasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly successMessage = signal<string | null>(null);

  onSubmitSuccess(): void {
    this.successMessage.set('Đổi mật khẩu thành công! Đang chuyển hướng...');
    const target = this.authService.getRole() === 'ADMIN' ? '/admin' : '/';
    setTimeout(() => void this.router.navigateByUrl(target), 800);
  }

  onLogout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }
}
