import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerAddress } from '../../../../../account/addresses/data-access/addresses.models';

@Component({
  selector: 'vic-address-select-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './address-select-modal.component.html',
  styleUrl: './address-select-modal.component.scss',
})
export class AddressSelectModalComponent {
  readonly addresses = input<CustomerAddress[]>([]);
  readonly selectedId = input<number | null>(null);
  readonly isOpen = input<boolean>(false);

  readonly selectAddress = output<CustomerAddress>();
  readonly closeModal = output<void>();

  onSelect(address: CustomerAddress): void {
    this.selectAddress.emit(address);
  }

  onClose(): void {
    this.closeModal.emit();
  }

  formatFullAddress(addr: CustomerAddress): string {
    return [addr.streetAddress, addr.ward, addr.district, addr.province]
      .filter(Boolean)
      .join(', ');
  }
}
