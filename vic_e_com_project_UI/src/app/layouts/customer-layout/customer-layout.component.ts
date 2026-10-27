import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserMenuComponent } from './components/user-menu/user-menu.component';
import { ToastComponent } from '../../shared/ui/toast/toast.component';
import { CartStateService } from '../../features/cart/services/cart-state.service';
import { WishlistStateService } from '../../features/wishlist/services/wishlist-state.service';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, UserMenuComponent, ToastComponent],
  templateUrl: './customer-layout.component.html',
  styleUrl: './customer-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerLayoutComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly cartState = inject(CartStateService);
  readonly wishlistState = inject(WishlistStateService);

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.cartState.refreshCount();
      this.wishlistState.refreshIds();
    }
  }
}
