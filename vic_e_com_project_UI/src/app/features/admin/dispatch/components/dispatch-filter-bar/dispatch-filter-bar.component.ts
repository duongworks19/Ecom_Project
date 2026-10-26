import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { DispatchCounts } from '../../models/dispatch.models';

@Component({
  selector: 'vic-dispatch-filter-bar',
  standalone: true,
  templateUrl: './dispatch-filter-bar.component.html',
  styleUrl: './dispatch-filter-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DispatchFilterBarComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  readonly counts = input<DispatchCounts>({
    waiting: 0,
    delivering: 0,
    failed: 0,
    delivered: 0,
  });

  readonly currentStatus = input<string>('ALL');
  readonly currentQuery = input<string>('');

  readonly searchChange = output<string>();
  readonly statusChange = output<string>();

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => {
        this.searchChange.emit(query);
      });
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  selectStatus(status: string): void {
    this.statusChange.emit(status);
  }

  totalCount(): number {
    const c = this.counts();
    return c.waiting + c.delivering + c.failed + c.delivered;
  }
}
