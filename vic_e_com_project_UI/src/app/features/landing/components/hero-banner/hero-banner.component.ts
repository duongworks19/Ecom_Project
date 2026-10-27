import { Component } from '@angular/core';

interface TrustBadge {
  icon: string;
  label: string;
}

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [],
  templateUrl: './hero-banner.component.html',
  styleUrl: './hero-banner.component.scss',
})
export class HeroBannerComponent {
  readonly badges: TrustBadge[] = [
    { icon: '🛡️', label: '100% Chính Hãng' },
    { icon: '🚚', label: 'Giao Hàng Minh Bạch' },
    { icon: '🔄', label: 'Đổi Trả Dễ Dàng' },
    { icon: '🎧', label: 'Hỗ Trợ Ticket 24/7' },
  ];
}
