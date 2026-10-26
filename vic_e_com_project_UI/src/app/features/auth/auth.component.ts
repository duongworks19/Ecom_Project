import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
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
export class AuthComponent implements OnInit, AfterViewInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  @ViewChild('googleBtnContainer') googleBtnContainer?: ElementRef<HTMLElement>;

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

  ngAfterViewInit() {
    if (this.googleBtnContainer?.nativeElement) {
      this.authService.renderGoogleButton(this.googleBtnContainer.nativeElement, (idToken: string) =>
        this.onGoogleCredential(idToken)
      );
    }
  }

  private onGoogleCredential(idToken: string) {
    this.isLoading.set(true);
    this.authService.googleLogin(idToken).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.showToast('✨ Đăng nhập Google thành công!', false);
        if (res.data?.mustChangePassword) {
          void this.router.navigateByUrl('/change-password');
          return;
        }
        const target = res.data?.role === 'ADMIN' ? '/admin' : res.data?.role === 'SHIPPER' ? '/shipper' : '/';
        setTimeout(() => void this.router.navigateByUrl(target), 800);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Đăng nhập Google thất bại';
        this.showToast(msg, true);
      },
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
    if (!this.isLogin()) {
      const pwd = this.password();
      const hasUpper = /[A-Z]/.test(pwd);
      const hasLower = /[a-z]/.test(pwd);
      const hasDigit = /[0-9]/.test(pwd);
      if (pwd.length < 8 || !hasUpper || !hasLower || !hasDigit) {
        this.showToast('Mật khẩu cần tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số', true);
        return;
      }
    }
    if (!this.isLogin() && !this.fullName()) {
      this.showToast('Vui lòng nhập họ và tên', true);
      return;
    }

    this.isLoading.set(true);

    if (this.isLogin()) {
      // Đăng nhập — gọi API thực hoặc MockAuthService
      this.authService.login({ username: this.email(), password: this.password() }).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.data?.mustChangePassword) {
            void this.router.navigateByUrl('/change-password');
            return;
          }
<<<<<<< Updated upstream
          this.showToast('✨ Đăng nhập thành công!', false);
=======
>>>>>>> Stashed changes
          const target = this.getTargetRoute(res.data?.role);
          setTimeout(() => void this.router.navigateByUrl(target), 800);
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

  private getTargetRoute(role?: string): string {
    const normalizedRole = (role || '').toUpperCase();
    if (normalizedRole === 'ADMIN' || normalizedRole === 'ROLE_ADMIN') {
      return '/admin';
    }
    if (normalizedRole === 'VENDOR' || normalizedRole === 'ROLE_VENDOR') {
      return '/seller/dashboard';
    }
    if (normalizedRole === 'SHIPPER' || normalizedRole === 'ROLE_SHIPPER') {
      return '/shipper';
    }
    return '/';
  }

  handleSocialAuth(provider: string) {
    if (provider === 'Google') {
      this.isLoading.set(true);
      this.authService.initGoogleSignIn(
        (idToken: string) => {
          this.authService.googleLogin(idToken).subscribe({
            next: (res) => {
              this.isLoading.set(false);
              this.showToast('✨ Đăng nhập Google thành công!', false);
              if (res.data?.mustChangePassword) {
                void this.router.navigateByUrl('/change-password');
                return;
              }
              const target = this.getTargetRoute(res.data?.role);
              setTimeout(() => void this.router.navigateByUrl(target), 800);
            },
            error: (err: HttpErrorResponse) => {
              this.isLoading.set(false);
              const msg = err.error?.message || 'Đăng nhập Google thất bại';
              this.showToast(msg, true);
            },
          });
        },
        () => {
          this.isLoading.set(false);
          this.showToast(
            'Google Client ID chưa được cấp phép cho http://localhost:4200 trên Google Cloud Console (Authorized JavaScript origins). Vui lòng đăng nhập bằng Email/Mật khẩu.',
            true
          );
        }
      );
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
