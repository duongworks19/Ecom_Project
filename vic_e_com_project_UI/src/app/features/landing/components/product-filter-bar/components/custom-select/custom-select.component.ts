import {
  Component, ElementRef, EventEmitter, HostListener,
  Input, OnChanges, Output, computed, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SelectOption {
  label: string;
  value: string;
  icon?: string;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-select.component.html',
  styleUrl: './custom-select.component.scss',
})
export class CustomSelectComponent implements OnChanges {
  private readonly elementRef = inject(ElementRef);

  @Input({ required: true }) options: SelectOption[] = [];
  @Input() selectedValue = '';
  @Input() placeholder = 'Chọn...';
  @Output() selectionChange = new EventEmitter<string>();

  readonly isOpen = signal<boolean>(false);
  readonly currentValue = signal<string>('');

  readonly displayLabel = computed<string>(() => {
    const val = this.currentValue();
    const match = this.options.find((opt) => opt.value === val);
    return match ? match.label : this.placeholder;
  });

  ngOnChanges(): void {
    this.currentValue.set(this.selectedValue);
  }

  toggleDropdown(): void {
    this.isOpen.update((v) => !v);
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  selectOption(val: string, event: Event): void {
    event.stopPropagation();
    this.currentValue.set(val);
    this.selectionChange.emit(val);
    this.closeDropdown();
  }

  isSelected(val: string): boolean {
    return this.currentValue() === val;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }
}
