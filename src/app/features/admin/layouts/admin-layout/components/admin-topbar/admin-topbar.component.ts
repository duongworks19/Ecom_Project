import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../../../core/services/auth.service';

@Component({
  selector: 'vic-admin-topbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-topbar.component.html',
  styleUrl: './admin-topbar.component.scss',
})
export class AdminTopbarComponent {
  private readonly authService = inject(AuthService);
  readonly adminName = computed(() => this.authService.currentUserNameSignal() || '');
  readonly avatarInitial = computed(() => {
    const name = this.adminName().trim();
    return name ? name.charAt(0).toUpperCase() : '';
  });
}
