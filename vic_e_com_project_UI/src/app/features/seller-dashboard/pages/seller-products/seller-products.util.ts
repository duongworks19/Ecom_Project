import { CategoryItem } from '../../../../core/models/category.model';
import { SellerCategoryOption } from '../../models/seller-dashboard.model';
import { SellerProduct } from '../../services/seller-product.service';

export function formatVnd(amount: number): string {
  return (amount || 0).toLocaleString('vi-VN') + 'đ';
}

export function getMinPrice(p: SellerProduct): number {
  if (!p.v || !p.v.length) return 0;
  return Math.min(...p.v.map((v) => v.p));
}

export function getMaxPrice(p: SellerProduct): number {
  if (!p.v || !p.v.length) return 0;
  return Math.max(...p.v.map((v) => v.p));
}

export function getTotalStock(p: SellerProduct): number {
  if (!p.v || !p.v.length) return 0;
  return p.v.reduce((sum, v) => sum + v.q, 0);
}

export function buildCategoryTreeOptions(items: CategoryItem[]): SellerCategoryOption[] {
  const map = new Map<number, CategoryItem>();
  const childrenMap = new Map<number, CategoryItem[]>();

  for (const item of items) {
    const id = Number(item.id);
    map.set(id, item);
    const pid = item.parentId != null ? Number(item.parentId) : null;
    if (pid != null) {
      if (!childrenMap.has(pid)) childrenMap.set(pid, []);
      childrenMap.get(pid)!.push(item);
    }
  }

  const roots: CategoryItem[] = [];
  for (const item of items) {
    const pid = item.parentId != null ? Number(item.parentId) : null;
    if (pid == null || !map.has(pid)) roots.push(item);
  }

  const result: SellerCategoryOption[] = [];
  const visited = new Set<number>();

  const traverse = (node: CategoryItem, level: number) => {
    const id = Number(node.id);
    if (visited.has(id)) return;
    visited.add(id);

    let prefix = '';
    if (level === 1) prefix = '— ';
    else if (level >= 2) prefix = '—— ';

    result.push({
      id,
      name: node.name,
      displayName: prefix + node.name,
      parentId: node.parentId != null ? Number(node.parentId) : null,
      level,
    });

    const children = childrenMap.get(id) || [];
    for (const child of children) {
      traverse(child, level + 1);
    }
  };

  for (const root of roots) {
    traverse(root, 0);
  }
  return result;
}

