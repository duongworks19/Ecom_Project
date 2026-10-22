import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-status-dot',
  standalone: true,
  templateUrl: './status-dot.component.html',
  styleUrl: './status-dot.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusDotComponent {
  readonly label = input.required<string>();
  readonly color = input.required<string>();
}
