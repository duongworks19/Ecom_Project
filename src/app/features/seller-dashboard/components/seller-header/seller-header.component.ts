import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  SellerNotification,
  SellerNavTab,
} from '../../models/seller-dashboard.model';

@Component({
  selector: 'app-seller-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './seller-header.component.html',
  styleUrl: './seller-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerHeaderComponent {
  readonly shopName = input.required<string>();
  readonly shopAvatarLetter = input.required<string>();
  readonly unreadCount = input.required<number>();
  readonly notifications = input.required<SellerNotification[]>();

  readonly viewShopAsGuest = output<void>();
  readonly selectNotification = output<SellerNotification>();
  readonly markAllRead = output<void>();
  readonly openShopProfile = output<SellerNavTab>();

  readonly isNotifOpen = signal<boolean>(false);

  toggleNotifications(): void {
    this.isNotifOpen.update((v) => !v);
  }

  closeNotifications(): void {
    this.isNotifOpen.set(false);
  }

  onNotificationClick(item: SellerNotification): void {
    this.selectNotification.emit(item);
    this.isNotifOpen.set(false);
  }

  onMarkAllRead(event: Event): void {
    event.stopPropagation();
    this.markAllRead.emit();
  }
}
