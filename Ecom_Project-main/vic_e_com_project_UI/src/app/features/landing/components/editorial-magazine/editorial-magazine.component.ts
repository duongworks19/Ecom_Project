import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-editorial-magazine',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './editorial-magazine.component.html',
  styleUrl: './editorial-magazine.component.scss',
})
export class EditorialMagazineComponent {
  @Output() categorySelected = new EventEmitter<string>();

  selectCategory(category: string) {
    this.categorySelected.emit(category);
  }
}
