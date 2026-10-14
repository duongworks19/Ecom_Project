import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportReportItem } from '../../../../models/admin-reports.model';

@Component({
  selector: 'vic-export-data-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './export-data-card.component.html',
  styleUrl: './export-data-card.component.scss',
})
export class ExportDataCardComponent {
  @Input() items: ExportReportItem[] = [];

  onDownload(item: ExportReportItem): void {
    // Demo toast or feedback for download
  }
}
