import { CategoryItem, CategoryTreeNode } from '../models/admin-category.model';

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Chuyển chuỗi tiếng Việt thành slug chuẩn SEO (chỉ gồm a-z, 0-9 và dấu gạch ngang đơn)
 */
export function generateSlug(text: string): string {
  if (!text) return '';

  let slug = text.trim().toLowerCase();

  // Chuyển ký tự có dấu sang không dấu
  slug = slug
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd');

  // Bỏ ký tự đặc biệt, chuyển khoảng trắng và ký tự không hợp lệ thành '-'
  slug = slug.replace(/[^a-z0-9\s-]/g, '');
  slug = slug.replace(/[\s_]+/g, '-');
  slug = slug.replace(/-+/g, '-');
  slug = slug.replace(/^-+|-+$/g, '');

  return slug;
}

export function isValidSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}

/**
 * Dựng cấu trúc cây đa cấp từ danh sách phẳng
 */
export function buildCategoryTree(
  items: CategoryItem[],
  expandedIds: Set<number> = new Set()
): CategoryTreeNode[] {
  const nodeMap = new Map<number, CategoryTreeNode>();

  for (const item of items) {
    nodeMap.set(item.id, {
      ...item,
      children: [],
      expanded: expandedIds.has(item.id),
      isLeaf: item.childCount === 0,
    });
  }

  const rootNodes: CategoryTreeNode[] = [];

  for (const item of items) {
    const node = nodeMap.get(item.id)!;
    if (item.parentId && nodeMap.has(item.parentId)) {
      const parent = nodeMap.get(item.parentId)!;
      parent.children.push(node);
      parent.isLeaf = false;
      parent.childCount = Math.max(parent.childCount || 0, parent.children.length);
    } else {
      rootNodes.push(node);
    }
  }

  return rootNodes;
}

/**
 * Trải phẳng cây theo các nhánh đang mở (expanded)
 */
export function flattenCategoryTree(tree: CategoryTreeNode[]): CategoryTreeNode[] {
  const result: CategoryTreeNode[] = [];

  function traverse(nodes: CategoryTreeNode[]) {
    for (const node of nodes) {
      result.push(node);
      if (node.expanded && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(tree);
  return result;
}

/**
 * Lấy toàn bộ ID của các danh mục con, cháu, chắt...
 */
export function findDescendantIds(items: CategoryItem[], categoryId: number): number[] {
  const descendants: number[] = [];
  const queue = [categoryId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const directChildren = items.filter((item) => item.parentId === currentId);
    for (const child of directChildren) {
      descendants.push(child.id);
      queue.push(child.id);
    }
  }

  return descendants;
}

/**
 * Lấy toàn bộ danh sách CategoryItem con/cháu của một danh mục
 */
export function findDescendants(items: CategoryItem[], categoryId: number): CategoryItem[] {
  const descendantIds = new Set(findDescendantIds(items, categoryId));
  return items.filter((item) => descendantIds.has(item.id));
}

/**
 * Tính chiều sâu của cây con (subtree height) tính từ node này xuống
 * Node không có con -> depth = 1
 */
export function getSubtreeHeight(categoryId: number, items: CategoryItem[]): number {
  const directChildren = items.filter((item) => item.parentId === categoryId);
  if (directChildren.length === 0) return 1;

  let maxChildHeight = 0;
  for (const child of directChildren) {
    const childHeight = getSubtreeHeight(child.id, items);
    if (childHeight > maxChildHeight) {
      maxChildHeight = childHeight;
    }
  }

  return 1 + maxChildHeight;
}

/**
 * Kiểm tra xem danh mục candidate có thể được chọn làm cha của editingId không
 */
export function canBeParent(
  candidate: CategoryItem,
  editingId: number | null,
  allItems: CategoryItem[],
  maxDepth = 3
): { allowed: boolean; reason?: string } {
  if (candidate.level >= maxDepth) {
    return { allowed: false, reason: `Đã đạt tối đa ${maxDepth} cấp` };
  }

  if (editingId !== null) {
    if (candidate.id === editingId) {
      return { allowed: false, reason: 'Không thể chọn chính danh mục này làm cha' };
    }

    const descendantIds = new Set(findDescendantIds(allItems, editingId));
    if (descendantIds.has(candidate.id)) {
      return { allowed: false, reason: 'Không thể chọn danh mục con làm cha' };
    }

    const subtreeHeight = getSubtreeHeight(editingId, allItems);
    if (candidate.level + subtreeHeight > maxDepth) {
      return {
        allowed: false,
        reason: `Sẽ làm nhánh con vượt quá tối đa ${maxDepth} cấp`,
      };
    }
  }

  return { allowed: true };
}
