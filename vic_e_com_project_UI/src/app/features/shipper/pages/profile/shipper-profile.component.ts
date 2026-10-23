import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShipperPortalService } from '../../services/shipper-portal.service';
import { ShipperProfile } from '../../models/shipper.models';
import { UpdateProfileDialogComponent } from '../../components/update-profile-dialog/update-profile-dialog.component';
import { ChangePasswordDialogComponent } from '../../components/change-password-dialog/change-password-dialog.component';

@Component({
  selector: 'app-shipper-profile',
  standalone: true,
  imports: [
    CommonModule,
    UpdateProfileDialogComponent,
    ChangePasswordDialogComponent,
  ],
  templateUrl: './shipper-profile.component.html',
  styleUrl: './shipper-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ShipperProfileComponent implements OnInit {
  private readonly shipperService = inject(ShipperPortalService);
  readonly profile = signal<ShipperProfile | null>(null);

  readonly openUpdateDialog = signal<boolean>(false);
  readonly openPasswordDialog = signal<boolean>(false);

  ngOnInit(): void {
    this.shipperService.profile$.subscribe((prof) => {
      this.profile.set(prof);
    });
  }

  handleProfileSaved(updated: ShipperProfile): void {
    this.profile.set(updated);
  }

  getInitials(name?: string): string {
    if (!name) return 'SH';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
