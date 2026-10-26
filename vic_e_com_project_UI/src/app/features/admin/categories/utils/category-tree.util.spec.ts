import { describe, it, expect } from 'vitest';
import {
  generateSlug,
  isValidSlug,
  buildCategoryTree,
  flattenCategoryTree,
  findDescendants,
  canBeParent,
} from './category-tree.util';
import { CategoryItem } from '../models/admin-category.model';

describe('category-tree.util', () => {
  it('should generate valid SEO slug from Vietnamese name', () => {
    expect(generateSlug('Thời trang & Phụ kiện Nam')).toBe('thoi-trang-phu-kien-nam');
    expect(generateSlug('Áo sơ mi - Tay dài')).toBe('ao-so-mi-tay-dai');
    expect(isValidSlug('ao-khoac-nam')).toBe(true);
    expect(isValidSlug('ao_khoac')).toBe(false);
    expect(isValidSlug('-ao-')).toBe(false);
  });

  const mockItems: CategoryItem[] = [
    {
      id: 1,
      parentId: null,
      name: 'Thời trang',
      slug: 'thoi-trang',
      status: 'VISIBLE',
      level: 1,
      pathNames: ['Thời trang'],
      directProductCount: 0,
      totalProductCount: 248,
      childCount: 2,
    },
    {
      id: 2,
      parentId: 1,
      name: 'Áo',
      slug: 'ao',
      status: 'VISIBLE',
      level: 2,
      pathNames: ['Thời trang', 'Áo'],
      directProductCount: 0,
      totalProductCount: 142,
      childCount: 2,
    },
    {
      id: 3,
      parentId: 2,
      name: 'Áo thun',
      slug: 'ao-thun',
      status: 'VISIBLE',
      level: 3,
      pathNames: ['Thời trang', 'Áo', 'Áo thun'],
      directProductCount: 96,
      totalProductCount: 96,
      childCount: 0,
    },
    {
      id: 4,
      parentId: 2,
      name: 'Áo sơ mi',
      slug: 'ao-so-mi',
      status: 'VISIBLE',
      level: 3,
      pathNames: ['Thời trang', 'Áo', 'Áo sơ mi'],
      directProductCount: 46,
      totalProductCount: 46,
      childCount: 0,
    },
  ];

  it('should correctly build and flatten category tree with expanded nodes', () => {
    const expandedIds = new Set([1, 2]);
    const tree = buildCategoryTree(mockItems, expandedIds);

    expect(tree.length).toBe(1);
    expect(tree[0].name).toBe('Thời trang');
    expect(tree[0].children.length).toBe(1);
    expect(tree[0].children[0].name).toBe('Áo');
    expect(tree[0].children[0].children.length).toBe(2);

    const flattened = flattenCategoryTree(tree);
    expect(flattened.length).toBe(4);
  });

  it('should find descendants correctly', () => {
    const descendantsOfAo = findDescendants(mockItems, 2);
    expect(descendantsOfAo.map((d) => d.name)).toEqual(['Áo thun', 'Áo sơ mi']);
  });

  it('should enforce Max Depth = 3 parent selection constraints', () => {
    // Level 3 category cannot be parent
    const aoThun = mockItems.find((i) => i.id === 3)!;
    expect(canBeParent(aoThun, null, mockItems, 3).allowed).toBe(false);

    // Cannot choose self
    const ao = mockItems.find((i) => i.id === 2)!;
    expect(canBeParent(ao, 2, mockItems, 3).allowed).toBe(false);

    // Cannot choose descendant as parent
    expect(canBeParent(aoThun, 2, mockItems, 3).allowed).toBe(false);

    // Level 1 category can be parent for new item
    const thoiTrang = mockItems.find((i) => i.id === 1)!;
    expect(canBeParent(thoiTrang, null, mockItems, 3).allowed).toBe(true);
  });
});
