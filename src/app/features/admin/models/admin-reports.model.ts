export interface ReportKpiCard {
  id: string;
  title: string;
  value: string;
  subtext: string;
  isDark?: boolean;
}

export interface RevenueTrendPoint {
  date: string;
  currentAmount: number;
  previousAmount: number;
  isCurrentDay?: boolean;
}

export interface TopProductItem {
  rank: number;
  name: string;
  soldCount: number;
  percentage: number;
}

export interface TopVendorItem {
  rank: number;
  shopName: string;
  revenue: number;
  sharePercent: number;
}

export interface ExportReportItem {
  id: string;
  title: string;
  description: string;
  formats: ('Excel' | 'PDF' | 'CSV')[];
}

export interface AdminReportsData {
  kpis: ReportKpiCard[];
  revenueTrend: RevenueTrendPoint[];
  topProducts: TopProductItem[];
  topVendors: TopVendorItem[];
  exportItems: ExportReportItem[];
}
