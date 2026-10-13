import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

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
    // Cập nhật URL trình duyệt mượt mà
    const newPath = loginMode ? '/login' : '/register';
    window.history.replaceState({}, '', newPath);
  }

  togglePasswordVisibility() {
    this.showPassword.update((v) => !v);
  }

  handleSubmit(event: Event) {
    event.preventDefault();

    if (!this.email()) {
      this.showToast('Vui lòng nhập địa chỉ Email');
      return;
    }
    if (!this.password() || this.password().length < 6) {
      this.showToast('Mật khẩu cần tối thiểu 6 ký tự');
      return;
    }

    this.isLoading.set(true);

    setTimeout(() => {
      this.isLoading.set(false);
      const actionText = this.isLogin() ? 'Đăng nhập' : 'Đăng ký tài khoản';
      this.showToast(`✨ ${actionText} thành công! Đang chuyển về trang chủ...`);

      setTimeout(() => {
        this.router.navigate(['/']);
      }, 1200);
    }, 800);
  }

  handleSocialAuth(provider: string) {
    this.showToast(`Đang kết nối tài khoản ${provider}...`);
  }

  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 3200);
  }
}
