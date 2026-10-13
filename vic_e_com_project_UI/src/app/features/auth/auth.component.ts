import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  readonly isLogin = signal<boolean>(true);
  readonly showPassword = signal<boolean>(false);

  // Form State
  readonly email = signal<string>('');
  readonly password = signal<string>('');
  readonly fullName = signal<string>('');
  readonly phone = signal<string>('');
  readonly rememberMe = signal<boolean>(true);
  readonly agreeTerms = signal<boolean>(true);

  // UI Feedback
  readonly toastMessage = signal<string | null>(null);
  readonly toastError = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);

  ngOnInit() {
    // Tự động nhận diện đường dẫn /login hoặc /register
    const currentPath = this.router.url;
    if (currentPath.includes('register')) {
      this.isLogin.set(false);
    } else {
      this.isLogin.set(true);
    }

    this.route.url.subscribe((segments) => {
      const path = segments[0]?.path;
      this.isLogin.set(path !== 'register');
    });
  }

  setMode(loginMode: boolean) {
    this.isLogin.set(loginMode);
    const newPath = loginMode ? '/login' : '/register';
    window.history.replaceState({}, '', newPath);
  }

  togglePasswordVisibility() {
    this.showPassword.update((v) => !v);
  }

  handleSubmit(event: Event) {
    event.preventDefault();

    if (!this.email()) {
      this.showToast('Vui lòng nhập địa chỉ Email', true);
      return;
    }
    if (!this.password() || this.password().length < 6) {
      this.showToast('Mật khẩu cần tối thiểu 6 ký tự', true);
      return;
    }
    if (!this.isLogin() && !this.fullName()) {
      this.showToast('Vui lòng nhập họ và tên', true);
      return;
    }

    this.isLoading.set(true);

    if (this.isLogin()) {
      // Đăng nhập — gọi API thực
      this.authService.login({ username: this.email(), password: this.password() }).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.showToast('✨ Đăng nhập thành công!', false);
          setTimeout(() => this.router.navigate(['/']), 1200);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          const msg = err.error?.message || 'Email hoặc mật khẩu không đúng';
          this.showToast(msg, true);
        },
      });
    } else {
      // Đăng ký — gọi API thực
      this.authService.register({
        fullName: this.fullName(),
        email: this.email(),
        phone: this.phone() || undefined,
        password: this.password(),
      }).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.showToast('✨ Đăng ký thành công! Đang chuyển về trang chủ...', false);
          setTimeout(() => this.router.navigate(['/']), 1200);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          const msg = err.error?.message || 'Đăng ký thất bại, vui lòng thử lại';
          this.showToast(msg, true);
        },
      });
    }
  }

  handleSocialAuth(provider: string) {
    if (provider === 'Google') {
      this.isLoading.set(true);
      this.authService.initGoogleSignIn((idToken: string) => {
        this.authService.googleLogin(idToken).subscribe({
          next: () => {
            this.isLoading.set(false);
            this.showToast('✨ Đăng nhập Google thành công!', false);
            setTimeout(() => this.router.navigate(['/']), 1200);
          },
          error: (err: HttpErrorResponse) => {
            this.isLoading.set(false);
            const msg = err.error?.message || 'Đăng nhập Google thất bại';
            this.showToast(msg, true);
          },
        });
      });
    } else {
      this.showToast(`Tính năng ${provider} sẽ sớm ra mắt!`, false);
    }
  }

  showToast(msg: string, isError: boolean = false) {
    this.toastMessage.set(msg);
    this.toastError.set(isError);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 3200);
  }
}
