import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { AddressesApiService } from '../../data-access/addresses-api.service';
import { CustomerAddress, UpsertCustomerAddressRequest } from '../../data-access/addresses.models';
import { ApiError } from '../../../../../core/api/api-error.model';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { SkeletonComponent } from '../../../../../shared/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../../shared/ui/error-state/error-state.component';
import { ConfirmDialogComponent } from '../../../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { AddressCardComponent } from '../../components/address-card/address-card.component';
import { AddressDialogComponent } from '../../components/address-dialog/address-dialog.component';

@Component({
  selector: 'app-addresses-page',
  standalone: true,
  imports: [
    ButtonComponent,
    SkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    ConfirmDialogComponent,
    AddressCardComponent,
    AddressDialogComponent,
  ],
  templateUrl: './addresses-page.component.html',
  styleUrl: './addresses-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressesPageComponent implements OnInit {
  private readonly addressesApi = inject(AddressesApiService);
  private readonly toastService = inject(ToastService);

  readonly addresses = signal<CustomerAddress[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<ApiError | null>(null);

  readonly dialogOpen = signal<boolean>(false);
  readonly editingAddress = signal<CustomerAddress | null>(null);
  readonly dialogSaving = signal<boolean>(false);
  readonly dialogError = signal<string | null>(null);

  readonly deletingAddress = signal<CustomerAddress | null>(null);
  readonly deletingLoading = signal<boolean>(false);

  readonly settingDefaultId = signal<number | null>(null);

  readonly sortedAddresses = computed(() => {
    return [...this.addresses()].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  });

  ngOnInit(): void {
    this.loadAddresses();
  }

  loadAddresses(): void {
    this.loading.set(true);
    this.error.set(null);

    this.addressesApi.listAddresses().subscribe({
      next: (list) => {
        this.addresses.set(list);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err);
        this.loading.set(false);
      },
    });
  }

  openCreateDialog(): void {
    this.editingAddress.set(null);
    this.dialogError.set(null);
    this.dialogOpen.set(true);
  }

  openEditDialog(address: CustomerAddress): void {
    this.editingAddress.set(address);
    this.dialogError.set(null);
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
    this.editingAddress.set(null);
    this.dialogError.set(null);
  }

  onSaveAddress(payload: UpsertCustomerAddressRequest): void {
    this.dialogSaving.set(true);
    this.dialogError.set(null);

    const editing = this.editingAddress();
    const request$ = editing
      ? this.addressesApi.updateAddress(editing.id, payload)
      : this.addressesApi.createAddress(payload);

    request$.subscribe({
      next: () => {
        this.dialogSaving.set(false);
        this.closeDialog();
        this.toastService.success(
          editing ? 'Đã cập nhật địa chỉ.' : 'Đã thêm địa chỉ mới.'
        );
        this.loadAddresses();
      },
      error: (err: ApiError) => {
        this.dialogSaving.set(false);
        this.dialogError.set(err.message);
      },
    });
  }

  onSetDefault(address: CustomerAddress): void {
    if (address.isDefault) {
      return;
    }
    this.settingDefaultId.set(address.id);
    this.addressesApi.setDefaultAddress(address.id).subscribe({
      next: () => {
        this.settingDefaultId.set(null);
        this.addresses.update((items) =>
          items.map((item) => ({
            ...item,
            isDefault: item.id === address.id,
          }))
        );
        this.toastService.success('Đã thiết lập địa chỉ mặc định.');
      },
      error: (err: ApiError) => {
        this.settingDefaultId.set(null);
        this.toastService.error(err.message);
      },
    });
  }

  promptDelete(address: CustomerAddress): void {
    if (address.isDefault) {
      return;
    }
    this.deletingAddress.set(address);
  }

  cancelDelete(): void {
    if (!this.deletingLoading()) {
      this.deletingAddress.set(null);
    }
  }

  confirmDelete(): void {
    const target = this.deletingAddress();
    if (!target) {
      return;
    }
    this.deletingLoading.set(true);
    this.addressesApi.deleteAddress(target.id).subscribe({
      next: () => {
        this.deletingLoading.set(false);
        this.deletingAddress.set(null);
        this.addresses.update((items) => items.filter((item) => item.id !== target.id));
        this.toastService.success('Đã xóa địa chỉ.');
      },
      error: (err: ApiError) => {
        this.deletingLoading.set(false);
        this.deletingAddress.set(null);
        this.toastService.error(err.message);
      },
    });
  }
}
