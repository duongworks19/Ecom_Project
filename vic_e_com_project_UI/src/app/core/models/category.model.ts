export interface CategoryItem {
  id: number | string;
  parentId?: number | string | null;
  name: string;
  slug: string;
  status?: string;
  tagline?: string;
  itemCount?: string;
  bannerImage?: string;
}

export interface PublicCategoryResponse {
  items: CategoryItem[];
}

export interface CategoryTreeNode extends CategoryItem {
  children: CategoryTreeNode[];
}

