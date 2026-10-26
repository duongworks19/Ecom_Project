export type CategoryStatus = 'VISIBLE' | 'HIDDEN';
export type CategoryFilterStatus = 'ALL' | 'VISIBLE' | 'HIDDEN';

export interface CategoryItem {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  status: CategoryStatus;
  level: number;
  pathNames: string[];
  directProductCount: number;
  totalProductCount: number;
  childCount: number;
}

export interface CategorySummary {
  totalCategories: number;
  visibleCategories: number;
  hiddenCategories: number;
}

export interface CategoryOverviewResponse {
  summary: CategorySummary;
  maxDepth: number;
  items: CategoryItem[];
}

export interface SlugCheckResponse {
  slug: string;
  available: boolean;
  suggestedSlug: string | null;
}

export interface UpsertCategoryRequest {
  name: string;
  parentId: number | null;
  slug: string;
  status: CategoryStatus;
}

export interface ChangeStatusRequest {
  status: CategoryStatus;
}

export interface StatusChangeResponse {
  affectedIds: number[];
  affectedCount: number;
}

export interface CategoryTreeNode extends CategoryItem {
  children: CategoryTreeNode[];
  expanded: boolean;
  isLeaf: boolean;
}
