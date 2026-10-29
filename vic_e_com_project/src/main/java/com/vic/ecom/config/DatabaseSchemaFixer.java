package com.vic.ecom.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSchemaFixer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void onInit() {
        applyMigrations();
    }

    @Override
    public void run(ApplicationArguments args) {
        applyMigrations();
    }

    public synchronized void applyMigrations() {
        try {
            log.info("[DatabaseSchemaFixer] Đang kiểm tra và bổ sung cột cho bảng categories và products...");

            // Bổ sung cột status vào bảng categories nếu chưa tồn tại
            jdbcTemplate.execute("ALTER TABLE categories ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'VISIBLE' NOT NULL;");

            // Bổ sung các cột khác nếu cần
            jdbcTemplate.execute("ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id BIGINT;");
            jdbcTemplate.execute("ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug VARCHAR(150);");
            jdbcTemplate.execute("ALTER TABLE categories ADD COLUMN IF NOT EXISTS name VARCHAR(100);");

            // Cập nhật sequence categories_id_seq nếu có
            try {
                jdbcTemplate.execute("SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM categories;");
            } catch (Exception ignored) { }

            // Bổ sung category_id vào bảng products nếu chưa có
            jdbcTemplate.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id BIGINT;");

            log.info("[DatabaseSchemaFixer] Cập nhật cấu trúc bảng thành công.");
        } catch (Exception e) {
            log.warn("[DatabaseSchemaFixer] Cảnh báo khi cập nhật cấu trúc bảng: {}", e.getMessage());
        }
    }
}
