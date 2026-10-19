import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-avatar',
  standalone: true,
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  readonly name = input<string | null | undefined>('');
  readonly src = input<string | null | undefined>(null);
  readonly size = input<number>(40);
  readonly fontSize = input<number | null>(null);

  readonly imageFailed = signal<boolean>(false);

  readonly initial = computed(() => {
    const raw = (this.name() ?? '').trim();
    return raw ? raw.charAt(0).toUpperCase() : '?';
  });

  readonly resolvedFontSize = computed(() => {
    const custom = this.fontSize();
    if (custom) {
      return custom;
    }
    return Math.round(this.size() * 0.42);
  });

  onImageError(): void {
    this.imageFailed.set(true);
  }
}
