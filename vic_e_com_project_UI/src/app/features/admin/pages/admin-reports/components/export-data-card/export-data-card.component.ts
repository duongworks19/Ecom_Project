import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportReportItem } from '../../../../models/admin-reports.model';
import { AdminReportsService } from '../../../../services/admin-reports.service';

@Component({
  selector: 'vic-export-data-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './export-data-card.component.html',
  styleUrl: './export-data-card.component.scss',
})
export class ExportDataCardComponent {
  private reports = inject(AdminReportsService);
  @Input() items: ExportReportItem[] = [];

  onDownload(item: ExportReportItem): void {
    this.reports.download(item.id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${item.id}-report.csv`; anchor.click();
      URL.revokeObjectURL(url);
    });
  }
}
