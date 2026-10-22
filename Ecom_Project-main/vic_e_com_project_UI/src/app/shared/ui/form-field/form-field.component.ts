import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-form-field',
  standalone: true,
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent {
  readonly label = input.required<string>();
  readonly controlId = input.required<string>();
  readonly error = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly required = input<boolean>(false);

  readonly describedById = computed(() => {
    const ids: string[] = [];
    if (this.hint()) {
      ids.push(`${this.controlId()}-hint`);
    }
    if (this.error()) {
      ids.push(`${this.controlId()}-error`);
    }
    return ids.join(' ') || null;
  });
}
