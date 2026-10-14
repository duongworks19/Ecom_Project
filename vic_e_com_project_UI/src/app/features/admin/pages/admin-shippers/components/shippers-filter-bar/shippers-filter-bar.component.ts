import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ShipperFilterStatus } from '../../../../models/shipper.models';

@Component({
  selector: 'vic-shippers-filter-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './shippers-filter-bar.component.html',
  styleUrl: './shippers-filter-bar.component.scss',
})
export class ShippersFilterBarComponent implements OnInit, OnDestroy {
  readonly keywordControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl<ShipperFilterStatus>('ALL', { nonNullable: true });
  private readonly destroy$ = new Subject<void>();

  @Output() filterChange = new EventEmitter<{ keyword: string; status: ShipperFilterStatus }>();

  ngOnInit(): void {
    this.keywordControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((keyword) => {
        this.filterChange.emit({ keyword, status: this.statusControl.value });
      });

    this.statusControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((status) => {
      this.filterChange.emit({ keyword: this.keywordControl.value, status });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
