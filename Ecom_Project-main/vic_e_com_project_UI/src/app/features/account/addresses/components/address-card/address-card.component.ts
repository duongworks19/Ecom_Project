import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CustomerAddress } from '../../data-access/addresses.models';
import { formatVnPhoneDisplay } from '../../../../../shared/validators/vn-phone.validator';
import { TagComponent } from '../../../../../shared/ui/tag/tag.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';

@Component({
  selector: 'app-address-card',
  standalone: true,
  imports: [TagComponent, ButtonComponent],
  templateUrl: './address-card.component.html',
  styleUrl: './address-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressCardComponent {
  readonly address = input.required<CustomerAddress>();
  readonly settingDefault = input<boolean>(false);

  readonly editClicked = output<CustomerAddress>();
  readonly deleteClicked = output<CustomerAddress>();
  readonly setDefaultClicked = output<CustomerAddress>();

  readonly formattedPhone = computed(() => formatVnPhoneDisplay(this.address().phone));

  readonly regionLine = computed(() => {
    const a = this.address();
    return [a.ward, a.district, a.province].filter(Boolean).join(', ');
  });
}
