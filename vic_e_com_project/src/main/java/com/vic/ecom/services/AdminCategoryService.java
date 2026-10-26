package com.vic.ecom.services;

import com.vic.ecom.dto.AdminCategoryDtos.*;
import com.vic.ecom.entity.Category;
import com.vic.ecom.enums.CategoryStatus;
import com.vic.ecom.repository.*;
import com.vic.ecom.ultis.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class AdminCategoryService {
    private final CategoryRepository categories;
    private final ProductRepository products;

    @Transactional(readOnly = true)
    public CategoryOverviewResponse list(String keyword, CategoryStatus status) {
        List<Category> all = categories.findAllByOrderByIdAsc();
        Map<Long, Category> map = all.stream().collect(Collectors.toMap(Category::getId, c -> c));
        Map<Long, Long> productCounts = products.findAllByStatusNot("DELETED").stream().filter(p -> p.getCategoryId() != null).collect(Collectors.groupingBy(p -> p.getCategoryId(), Collectors.counting()));
        List<CategoryItem> items = all.stream().filter(c -> (keyword == null || keyword.isBlank() || c.getName().toLowerCase().contains(keyword.toLowerCase()) || c.getSlug().contains(keyword.toLowerCase())) && (status == null || c.getStatus() == status)).map(c -> item(c, map, productCounts)).toList();
        long visible = all.stream().filter(c -> c.getStatus() == CategoryStatus.VISIBLE).count();
        return new CategoryOverviewResponse(new Summary(all.size(), visible, all.size() - visible), 3, items);
    }

    @Transactional(readOnly = true)
    public SlugCheckResponse checkSlug(String raw, Long excludeId) {
        String slug = SlugUtil.toSlug(raw);
        boolean used = excludeId == null ? categories.existsBySlug(slug) : categories.existsBySlugAndIdNot(slug, excludeId);
        return new SlugCheckResponse(slug, !used, used ? suggestion(slug, excludeId) : null);
    }

    @Transactional
    public CategoryItem create(UpsertCategoryRequest req) {
        return save(null, req);
    }

    @Transactional
    public CategoryItem update(Long id, UpsertCategoryRequest req) {
        require(id);
        return save(id, req);
    }

    @Transactional public StatusChangeResponse changeStatus(Long id, CategoryStatus status) {
        Category root = require(id); List<Category> all = categories.findAllByOrderByIdAsc(); List<Long> ids = status == CategoryStatus.HIDDEN ? all.stream().filter(c -> c.getId().equals(id) || isDescendant(c, id, all)).map(Category::getId).toList() : List.of(id);
        all.stream().filter(c -> ids.contains(c.getId())).forEach(c -> c.setStatus(status)); categories.saveAll(all);
        return new StatusChangeResponse(ids, ids.size());
    }

    @Transactional public void delete(Long id) {
        require(id); List<Category> all = categories.findAllByOrderByIdAsc(); long children = all.stream().filter(c -> Objects.equals(c.getParentId(), id)).count(); long count = products.countByCategoryIdAndStatusNot(id, "DELETED");
        if (children > 0 || count > 0) throw CustomerAccountException.unprocessable("CATEGORY_NOT_EMPTY", "Chưa thể xóa: danh mục còn " + count + " sản phẩm và " + children + " danh mục con. Chỉ xóa được danh mục trống; nếu không muốn hiển thị, hãy ẩn danh mục.", null);
        categories.deleteById(id);
    }

    private CategoryItem save(Long id, UpsertCategoryRequest req) {
        if (req == null || req.name() == null || req.name().isBlank() || req.name().trim().length() > 100)
            throw CustomerAccountException.badRequest("INVALID_NAME", "Tên danh mục bắt buộc và tối đa 100 ký tự", "name");
        Category c = id == null ? new Category() : require(id); String slug = req.slug() == null || req.slug().isBlank() ? SlugUtil.toSlug(req.name()) : SlugUtil.toSlug(req.slug());

        if (slug.isBlank()) throw CustomerAccountException.badRequest("INVALID_SLUG", "Slug không hợp lệ", "slug");

        if (!slug.matches("^[a-z0-9]+(?:-[a-z0-9]+)*$")) throw CustomerAccountException.badRequest("INVALID_SLUG", "Slug chỉ gồm chữ thường, số và dấu gạch ngang", "slug");

        if (id == null ? categories.existsBySlug(slug) : categories.existsBySlugAndIdNot(slug, id)) throw CustomerAccountException.unprocessable("SLUG_EXISTS", "Slug đã tồn tại; suggestedSlug=" + suggestion(slug, id), "slug");
        validateParent(c, req.parentId()); c.setName(req.name().trim()); c.setSlug(slug); c.setParentId(req.parentId()); c.setStatus(req.status() == null ? CategoryStatus.VISIBLE : req.status()); categories.save(c); return item(c, categories.findAllByOrderByIdAsc().stream().collect(Collectors.toMap(Category::getId, x -> x)), Map.of());
    }

    private void validateParent(Category self, Long parentId) {
        if (parentId == null) return; List<Category> all = categories.findAllByOrderByIdAsc();
        Category p = all.stream().filter(c -> c.getId().equals(parentId)).findFirst().orElseThrow(() ->
                CustomerAccountException.notFound("PARENT_NOT_FOUND", "Không tìm thấy danh mục cha"));

        if (self.getId() != null && (parentId.equals(self.getId()) || isDescendant(p, self.getId(), all))) throw CustomerAccountException.unprocessable("CATEGORY_CYCLE", "Không thể tạo vòng lặp danh mục", "parentId");

        if (level(p, all) >= 3 || (self.getId() != null && level(p, all) + subtreeDepth(self.getId(), all) - 1 > 3)) throw CustomerAccountException.unprocessable("MAX_CATEGORY_DEPTH", "Đã đạt giới hạn tối đa 3 cấp danh mục", "parentId");
    }

    private int subtreeDepth(Long root, List<Category> all) {
        int rootLevel = level(all.stream().filter(c -> c.getId().equals(root)).findFirst().orElseThrow(), all); return all.stream().filter(c -> c.getId().equals(root) || isDescendant(c, root, all)).mapToInt(c -> level(c, all) - rootLevel + 1).max().orElse(1); }

    private Category require(Long id) {
        return categories.findById(id).orElseThrow(() -> CustomerAccountException.notFound("CATEGORY_NOT_FOUND", "Không tìm thấy danh mục")); }

    private CategoryItem item(Category c, Map<Long, Category> map, Map<Long, Long> counts) {
        List<String> path = new ArrayList<>();
        Category x = c; while (x != null) {
            path.add(0, x.getName()); x = map.get(x.getParentId());
        }
        long direct = counts.getOrDefault(c.getId(), 0L);
        long total = direct + map.values().stream().filter(d -> isDescendant(d, c.getId(), map.values().stream().toList())).mapToLong(d -> counts.getOrDefault(d.getId(), 0L)).sum();
        return new CategoryItem(c.getId(), c.getParentId(), c.getName(), c.getSlug(), c.getStatus(), path.size(), path, direct, total, map.values().stream().filter(d -> Objects.equals(d.getParentId(), c.getId())).count());
    }

    private int level(Category c, List<Category> all) {
        int n=1; while(c.getParentId()!=null){
            n++; Long p=c.getParentId(); c=all.stream().filter(x->x.getId().equals(p)).findFirst().orElse(null); if(c==null) break; } return n; }

    private boolean isDescendant(Category c, Long ancestor, List<Category> all) {
        Map<Long, Category> byId = all.stream().collect(Collectors.toMap(Category::getId, x -> x));
        Long p=c.getParentId();
        while(p!=null){
            if(p.equals(ancestor))
                return true;
            Category parent = byId.get(p);
            p = parent == null ? null : parent.getParentId();
        }
        return false;
    }

    private String suggestion(String base, Long exclude) {
        for(int i=2;;i++){
            String s=base+"-"+i;
            boolean used=exclude==null?categories.existsBySlug(s):categories.existsBySlugAndIdNot(s,exclude);
            if(!used)return s;
        }
    }
}
