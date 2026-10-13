import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CategoryItem } from '../../../../core/models/category.model';

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hero-banner.component.html',
  styleUrl: './hero-banner.component.scss',
})
export class HeroBannerComponent {
  @Input({ required: true }) categories: CategoryItem[] = [];
  @Input() activeCategoryId = 'all';

  @Output() categorySelected = new EventEmitter<string>();

  onSelectCategory(id: string) {
    this.categorySelected.emit(id);
  }
}
