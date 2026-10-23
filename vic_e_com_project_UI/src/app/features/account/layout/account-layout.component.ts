import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ProfileApiService } from '../profile/data-access/profile-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar.component';

@Component({
  selector: 'app-account-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AvatarComponent],
  templateUrl: './account-layout.component.html',
  styleUrl: './account-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountLayoutComponent implements OnInit {
  readonly profileService = inject(ProfileApiService);
  readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.profileService.ensureProfileLoaded();
  }
}
