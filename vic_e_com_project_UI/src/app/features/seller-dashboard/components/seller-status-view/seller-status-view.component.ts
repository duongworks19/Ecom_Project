import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VendorState } from '../../models/seller-dashboard.model';

@Component({
  selector: 'app-seller-status-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './seller-status-view.component.html',
  styleUrl: './seller-status-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerStatusViewComponent {
  readonly state = input.required<VendorState>();

  readonly resubmit = output<Record<string, string>>();
  readonly reRegister = output<void>();

  readonly files = signal<Record<string, string>>({});
  readonly fileError = signal<string | null>(null);

  readonly requiredDocs = ['CCCD mặt sau', 'Giấy phép kinh doanh'];

  readonly isAllFilesSelected = computed(() => {
    const f = this.files();
    return this.requiredDocs.every((doc) => Boolean(f[doc]));
  });

  onFileChange(docName: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!/\.(jpe?g|png|pdf)$/i.test(file.name) || file.size > 5 * 1024 * 1024) {
      this.fileError.set('Chỉ nhận JPG, PNG hoặc PDF và dung lượng tối đa 5MB.');
      return;
    }

    this.fileError.set(null);
    this.files.update((curr) => ({
      ...curr,
      [docName]: file.name,
    }));
  }

  onSubmitDocs(): void {
    if (!this.isAllFilesSelected()) {
      this.fileError.set(`Vui lòng chọn đủ ${this.requiredDocs.length} tệp để gửi.`);
      return;
    }
    this.resubmit.emit(this.files());
  }
}
