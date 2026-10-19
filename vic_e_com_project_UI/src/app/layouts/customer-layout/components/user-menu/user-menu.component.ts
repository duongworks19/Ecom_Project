import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  ViewChildren,
  QueryList,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ProfileApiService } from '../../../../features/account/profile/data-access/profile-api.service';
import { AvatarComponent } from '../../../../shared/ui/avatar/avatar.component';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [AvatarComponent],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent implements OnInit {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  readonly profileService = inject(ProfileApiService);

  readonly isOpen = signal<boolean>(false);

  @ViewChild('triggerButton') triggerButton?: ElementRef<HTMLButtonElement>;
  @ViewChildren('menuItem') menuItems?: QueryList<ElementRef<HTMLButtonElement>>;

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.profileService.ensureProfileLoaded();
    }
  }

  toggleMenu(): void {
    const next = !this.isOpen();
    this.isOpen.set(next);
    if (next) {
      setTimeout(() => this.focusItemAt(0), 0);
    }
  }

  closeMenu(restoreFocus = false): void {
    if (!this.isOpen()) {
      return;
    }
    this.isOpen.set(false);
    if (restoreFocus) {
      setTimeout(() => this.triggerButton?.nativeElement.focus(), 0);
    }
  }

  onTriggerKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!this.isOpen()) {
        this.isOpen.set(true);
      }
      setTimeout(() => this.focusItemAt(0), 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.isOpen()) {
        this.isOpen.set(true);
      }
      setTimeout(() => {
        const count = this.menuItems?.length ?? 0;
        if (count > 0) {
          this.focusItemAt(count - 1);
        }
      }, 0);
    } else if (event.key === 'Escape' && this.isOpen()) {
      event.preventDefault();
      this.closeMenu(true);
    }
  }

  onMenuKeyDown(event: KeyboardEvent): void {
    const items = this.menuItems?.toArray().map((ref) => ref.nativeElement) ?? [];
    if (items.length === 0) {
      return;
    }
    const activeIndex = items.indexOf(document.activeElement as HTMLButtonElement);

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeMenu(true);
      return;
    }

    if (event.key === 'Tab') {
      this.closeMenu(false);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = activeIndex >= 0 ? (activeIndex + 1) % items.length : 0;
      this.focusItemAt(nextIndex);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIndex =
        activeIndex >= 0 ? (activeIndex - 1 + items.length) % items.length : items.length - 1;
      this.focusItemAt(prevIndex);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      this.focusItemAt(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      this.focusItemAt(items.length - 1);
    }
  }

  navigateToProfile(): void {
    this.closeMenu(false);
    void this.router.navigateByUrl('/account/profile');
  }

  navigateToOrders(): void {
    this.closeMenu(false);
    void this.router.navigateByUrl('/account/orders');
  }

  logout(): void {
    this.closeMenu(false);
    this.profileService.logout().subscribe({
      next: () => {
        void this.router.navigateByUrl('/login');
      },
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) {
      return;
    }
    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.closeMenu(false);
    }
  }

  private focusItemAt(index: number): void {
    const items = this.menuItems?.toArray() ?? [];
    items[index]?.nativeElement.focus();
  }
}
