import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { SellerOnboardingService } from '../../services/seller-onboarding.service';

@Component({
  selector: 'app-seller-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './seller-landing.component.html',
  styleUrl: './seller-landing.component.scss',
})
export class SellerLandingComponent {
  private readonly authService = inject(AuthService);
  private readonly onboardingService = inject(SellerOnboardingService);
  private readonly router = inject(Router);

  onStartRegistration(): void {
    const role = this.authService.getRole()?.toUpperCase();
    if (role === 'ADMIN' || role === 'ROLE_ADMIN') {
      void this.router.navigate(['/admin']);
      return;
    }
    this.router.navigate(['/seller/register']);
  }
}
