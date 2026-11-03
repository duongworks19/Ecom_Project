import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-seller-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seller-toast.component.html',
  styleUrl: './seller-toast.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerToastComponent {
  @Input() message: string | null = null;
  @Input() isError = false;
}
