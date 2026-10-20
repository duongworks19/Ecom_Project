import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'vic-users-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-filter-bar.component.html',
  styleUrl: './users-filter-bar.component.scss',
})
export class UsersFilterBarComponent {
  keyword = '';
  status = 'ALL';

  @Output() filterChange = new EventEmitter<{ keyword: string; status: string }>();

  onFilterChange(): void {
    this.filterChange.emit({ keyword: this.keyword, status: this.status });
  }
}
