import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShipperPortalService } from '../../services/shipper-portal.service';
import { ShipperProfile } from '../../models/shipper.models';

@Component({
  selector: 'app-shipper-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shipper-profile.component.html',
  styleUrl: './shipper-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ShipperProfileComponent implements OnInit {
  private readonly shipperService = inject(ShipperPortalService);
  readonly profile = signal<ShipperProfile | null>(null);

  ngOnInit(): void {
    this.shipperService.profile$.subscribe((prof) => {
      this.profile.set(prof);
    });
  }
}
