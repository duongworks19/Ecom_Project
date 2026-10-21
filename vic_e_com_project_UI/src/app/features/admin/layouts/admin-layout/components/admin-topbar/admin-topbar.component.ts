import { Component, ElementRef, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../../../core/services/auth.service';
import { ProfileApiService } from '../../../../../account/profile/data-access/profile-api.service';

@Component({
  selector: 'vic-admin-topbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-topbar.component.html',
  styleUrl: './admin-topbar.component.scss',
})
export class AdminTopbarComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  readonly profileService = inject(ProfileApiService);

  readonly isOpen = signal(false);
  readonly adminName = computed(
    () => this.profileService.displayName() || this.authService.currentUserNameSignal() || ''
  );
  readonly avatarInitial = computed(() => {
    const name = this.adminName().trim();
    return name ? name.charAt(0).toUpperCase() : '';
  });

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.profileService.ensureProfileLoaded();
    }
  }

  toggleMenu(): void {
    this.isOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.isOpen.set(false);
  }

  logout(): void {
    this.closeMenu();
    this.profileService.logout().subscribe({
      next: () => {
        void this.router.navigateByUrl('/login');
      },
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeMenu();
    }
  }
}
