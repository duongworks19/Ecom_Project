package com.vic.ecom.services;

import com.vic.ecom.dto.AdminCategoryDtos.*;
import com.vic.ecom.entity.Category;
import com.vic.ecom.enums.CategoryStatus;
import com.vic.ecom.repository.CategoryRepository;
import com.vic.ecom.repository.ProductRepository;
import com.vic.ecom.ultis.CustomerAccountException;
import com.vic.ecom.ultis.SlugUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminCategoryService {

    private final CategoryRepository categories;
    private final ProductRepository products;
    private final JdbcTemplate jdbcTemplate;

    private static final Set<String> SEED_SLUGS = Set.of(
            "cong-nghe-dien-may", "dien-thoai-tablet", "laptop-may-tinh", "thiet-bi-am-thanh",
            "thoi-trang-phu-kien", "thoi-trang-nam", "thoi-trang-nu", "giay-dep-tui-xach",
            "nha-cua-noi-that", "noi-that-phong-khach", "noi-that-phong-ngu", "do-gia-dung-bep",
            "lam-dep-cham-soc-da", "cham-soc-da-mat", "trang-diem", "nuoc-hoa-chinh-hang",
            "the-thao-da-ngoai", "do-tap-gym-yoga", "da-ngoai-cam-trai",
            "am-thuc-bach-hoa", "thuc-pham-dong-goi", "do-uong-tra-thao-moc",
            "me-be-do-choi", "sua-dinh-duong-cho-be", "do-choi-giao-duc",
            "sach-nghe-thuat", "sach-van-hoc-ky-nang", "dung-cu-ve-thu-cong"
    );

    @Transactional
    public CategoryOverviewResponse list(String keyword, CategoryStatus status) {
        ensureSchema();
        purgePreseededCategoriesIfAny();

        List<Category> all = categories.findAllByOrderByIdAsc();
        all.forEach(c -> {
            if (c.getStatus() == null) c.setStatus(CategoryStatus.VISIBLE);
            if (c.getName() == null) c.setName("");
            if (c.getSlug() == null) c.setSlug("");
        });

        Map<Long, Category> map = all.stream()
                .filter(c -> c.getId() != null)
                .collect(Collectors.toMap(Category::getId, c -> c, (a, b) -> a, LinkedHashMap::new));

        Map<Long, Long> productCounts = computeProductCounts();

        String kw = keyword == null ? "" : keyword.trim().toLowerCase();
        List<CategoryItem> items = all.stream()
                .filter(c -> (kw.isEmpty() || c.getName().toLowerCase().contains(kw) || c.getSlug().toLowerCase().contains(kw))
                        && (status == null || c.getStatus() == status))
                .map(c -> item(c, map, productCounts))
                .toList();

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
        ensureSchema();
        return save(null, req);
    }

    @Transactional
    public CategoryItem update(Long id, UpsertCategoryRequest req) {
        ensureSchema();
        require(id);
        return save(id, req);
    }

    @Transactional
    public StatusChangeResponse changeStatus(Long id, CategoryStatus status) {
        ensureSchema();
        require(id);
        List<Category> all = categories.findAllByOrderByIdAsc();
        Map<Long, Category> map = all.stream()
                .filter(c -> c.getId() != null)
                .collect(Collectors.toMap(Category::getId, c -> c, (a, b) -> a, LinkedHashMap::new));

        List<Long> ids = status == CategoryStatus.HIDDEN
                ? all.stream().filter(c -> Objects.equals(c.getId(), id) || isDescendant(c, id, map)).map(Category::getId).filter(Objects::nonNull).toList()
                : List.of(id);

        all.stream().filter(c -> ids.contains(c.getId())).forEach(c -> c.setStatus(status));
        categories.saveAll(all);
        return new StatusChangeResponse(ids, ids.size());
    }

    @Transactional
    public void delete(Long id) {
        ensureSchema();
        require(id);
        List<Category> all = categories.findAllByOrderByIdAsc();
        long children = all.stream().filter(c -> Objects.equals(c.getParentId(), id)).count();
        long count = 0;
        try {
            count = products.countByCategoryIdAndStatusNot(id, "DELETED");
        } catch (Exception e) {
            log.warn("Cannot count products for category {}: {}", id, e.getMessage());
        }
        if (children > 0) {
            throw CustomerAccountException.unprocessable(
                    "CATEGORY_NOT_EMPTY",
                    "Chưa thể xóa: danh mục còn " + children + " danh mục con. Vui lòng xóa hoặc di chuyển danh mục con trước.",
                    null
            );
        }
        if (count > 0) {
            throw CustomerAccountException.unprocessable(
                    "CATEGORY_NOT_EMPTY",
                    "Chưa thể xóa: danh mục còn " + count + " sản phẩm liên kết.",
                    null
            );
        }
        categories.deleteById(id);
    }

    public synchronized void ensureSchema() {
        try {
            jdbcTemplate.execute("ALTER TABLE categories ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'VISIBLE' NOT NULL;");
            jdbcTemplate.execute("ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id BIGINT;");
            jdbcTemplate.execute("ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug VARCHAR(150);");
            jdbcTemplate.execute("ALTER TABLE categories ADD COLUMN IF NOT EXISTS name VARCHAR(100);");
            jdbcTemplate.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id BIGINT;");
        } catch (Exception e) {
            log.warn("[AdminCategoryService] Cannot ensure schema for categories: {}", e.getMessage());
        }
    }

    private CategoryItem save(Long id, UpsertCategoryRequest req) {
        if (req == null || req.name() == null || req.name().isBlank() || req.name().trim().length() > 100) {
            throw CustomerAccountException.badRequest("INVALID_NAME", "Tên danh mục bắt buộc và tối đa 100 ký tự", "name");
        }

        Category c = (id == null) ? new Category() : require(id);
        String rawSlug = (req.slug() == null || req.slug().isBlank()) ? req.name() : req.slug();
        String slug = SlugUtil.toSlug(rawSlug);

        if (slug.isBlank()) {
            throw CustomerAccountException.badRequest("INVALID_SLUG", "Slug không hợp lệ", "slug");
        }
        if (!slug.matches("^[a-z0-9]+(?:-[a-z0-9]+)*$")) {
            throw CustomerAccountException.badRequest("INVALID_SLUG", "Slug chỉ gồm chữ thường, số và dấu gạch ngang", "slug");
        }

        boolean exists = (id == null) ? categories.existsBySlug(slug) : categories.existsBySlugAndIdNot(slug, id);
        if (exists) {
            throw CustomerAccountException.unprocessable("SLUG_EXISTS", "Slug đã tồn tại; suggestedSlug=" + suggestion(slug, id), "slug");
        }

        validateParent(c, req.parentId());
        c.setName(req.name().trim());
        c.setSlug(slug);
        c.setParentId(req.parentId());
        c.setStatus(req.status() == null ? CategoryStatus.VISIBLE : req.status());

        Category saved = categories.saveAndFlush(c);

        List<Category> all = categories.findAllByOrderByIdAsc();
        Map<Long, Category> map = all.stream()
                .filter(x -> x.getId() != null)
                .collect(Collectors.toMap(Category::getId, x -> x, (a, b) -> a, LinkedHashMap::new));
        if (saved.getId() != null && !map.containsKey(saved.getId())) {
            map.put(saved.getId(), saved);
        }

        Map<Long, Long> counts = computeProductCounts();
        return item(saved, map, counts);
    }

    private void validateParent(Category self, Long parentId) {
        if (parentId == null) return;
        List<Category> all = categories.findAllByOrderByIdAsc();
        Category p = all.stream()
                .filter(c -> Objects.equals(c.getId(), parentId))
                .findFirst()
                .orElseThrow(() -> CustomerAccountException.notFound("PARENT_NOT_FOUND", "Không tìm thấy danh mục cha"));

        Map<Long, Category> map = all.stream()
                .filter(x -> x.getId() != null)
                .collect(Collectors.toMap(Category::getId, x -> x, (a, b) -> a, LinkedHashMap::new));

        if (self.getId() != null && (Objects.equals(parentId, self.getId()) || isDescendant(p, self.getId(), map))) {
            throw CustomerAccountException.unprocessable("CATEGORY_CYCLE", "Không thể tạo vòng lặp danh mục", "parentId");
        }

        if (level(p, map) >= 3 || (self.getId() != null && level(p, map) + subtreeDepth(self.getId(), map) - 1 > 3)) {
            throw CustomerAccountException.unprocessable("MAX_CATEGORY_DEPTH", "Đã đạt giới hạn tối đa 3 cấp danh mục", "parentId");
        }
    }

    private int subtreeDepth(Long root, Map<Long, Category> map) {
        Category rootCat = map.get(root);
        if (rootCat == null) return 1;
        int rootLevel = level(rootCat, map);
        return map.values().stream()
                .filter(c -> Objects.equals(c.getId(), root) || isDescendant(c, root, map))
                .mapToInt(c -> level(c, map) - rootLevel + 1)
                .max()
                .orElse(1);
    }

    private Category require(Long id) {
        return categories.findById(id).orElseThrow(() -> CustomerAccountException.notFound("CATEGORY_NOT_FOUND", "Không tìm thấy danh mục"));
    }

    private CategoryItem item(Category c, Map<Long, Category> map, Map<Long, Long> counts) {
        List<String> path = new ArrayList<>();
        Set<Long> seen = new HashSet<>();
        Category x = c;
        while (x != null && x.getId() != null && seen.add(x.getId())) {
            path.add(0, x.getName() != null ? x.getName() : "");
            x = (x.getParentId() == null) ? null : map.get(x.getParentId());
        }
        if (path.isEmpty() && c.getName() != null) {
            path.add(c.getName());
        }

        Long catId = c.getId();
        long direct = (catId != null) ? counts.getOrDefault(catId, 0L) : 0L;
        long total = direct + (catId != null
                ? map.values().stream()
                .filter(d -> isDescendant(d, catId, map))
                .mapToLong(d -> d.getId() != null ? counts.getOrDefault(d.getId(), 0L) : 0L)
                .sum()
                : 0L);

        long childCount = (catId != null)
                ? map.values().stream().filter(d -> Objects.equals(d.getParentId(), catId)).count()
                : 0L;

        return new CategoryItem(
                c.getId(),
                c.getParentId(),
                c.getName() != null ? c.getName() : "",
                c.getSlug() != null ? c.getSlug() : "",
                c.getStatus() != null ? c.getStatus() : CategoryStatus.VISIBLE,
                Math.max(1, path.size()),
                path,
                direct,
                total,
                childCount
        );
    }

    private int level(Category c, Map<Long, Category> map) {
        int n = 1;
        Set<Long> seen = new HashSet<>();
        while (c != null && c.getParentId() != null && seen.add(c.getId()) && n < 50) {
            n++;
            c = map.get(c.getParentId());
        }
        return n;
    }

    private boolean isDescendant(Category c, Long ancestor, Map<Long, Category> byId) {
        if (c == null || ancestor == null || c.getParentId() == null) return false;
        Long p = c.getParentId();
        Set<Long> visited = new HashSet<>();
        while (p != null && visited.add(p)) {
            if (p.equals(ancestor)) return true;
            Category parent = byId.get(p);
            p = (parent == null) ? null : parent.getParentId();
        }
        return false;
    }

    private String suggestion(String base, Long exclude) {
        for (int i = 2; ; i++) {
            String s = base + "-" + i;
            boolean used = (exclude == null) ? categories.existsBySlug(s) : categories.existsBySlugAndIdNot(s, exclude);
            if (!used) return s;
        }
    }

    /**
     * Dọn sạch các danh mục mẫu sinh tự động trước đó nếu có trong DB,
     * để trả lại trạng thái dữ liệu do người dùng tự tạo.
     */
    private void purgePreseededCategoriesIfAny() {
        try {
            List<Category> all = categories.findAll();
            List<Category> seeded = all.stream()
                    .filter(c -> c.getSlug() != null && SEED_SLUGS.contains(c.getSlug().trim().toLowerCase()))
                    .toList();
            if (!seeded.isEmpty()) {
                log.info("Purging {} pre-seeded mock categories...", seeded.size());
                List<Category> children = seeded.stream().filter(c -> c.getParentId() != null).toList();
                List<Category> parents = seeded.stream().filter(c -> c.getParentId() == null).toList();
                categories.deleteAll(children);
                categories.deleteAll(parents);
            }
        } catch (Exception e) {
            log.warn("Cannot purge pre-seeded categories: {}", e.getMessage());
        }
    }

    /**
     * Đếm số lượng sản phẩm thực tế theo categoryId
     */
    private Map<Long, Long> computeProductCounts() {
        Map<Long, Long> counts = new HashMap<>();
        try {
            for (Object[] row : products.countActiveGroupByCategory()) {
                if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                    Long catId = ((Number) row[0]).longValue();
                    Long c = ((Number) row[1]).longValue();
                    counts.put(catId, c);
                }
            }
        } catch (Exception ignored) { }
        return counts;
    }
}
