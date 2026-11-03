package com.vic.ecom.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@Slf4j
@Configuration
public class DatabaseMigrationConfig {

    public DatabaseMigrationConfig(DataSource dataSource) {
        log.info("Running automatic schema migration for shops and discount_campaigns...");
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            // 1. Ensure follower_count exists in shops table
            stmt.execute("ALTER TABLE shops ADD COLUMN IF NOT EXISTS follower_count BIGINT DEFAULT 0;");
            stmt.execute("UPDATE shops SET follower_count = 0 WHERE follower_count IS NULL;");

            // 2. Ensure discount_campaigns columns exist
            stmt.execute("ALTER TABLE discount_campaigns ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT 'Chương trình giảm giá';");
            stmt.execute("ALTER TABLE discount_campaigns ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'FLASH_SALE';");
            stmt.execute("ALTER TABLE discount_campaigns ADD COLUMN IF NOT EXISTS discount_percent INT DEFAULT 10;");
            stmt.execute("ALTER TABLE discount_campaigns ADD COLUMN IF NOT EXISTS product_count INT DEFAULT 1;");
            stmt.execute("ALTER TABLE discount_campaigns ADD COLUMN IF NOT EXISTS start_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
            stmt.execute("ALTER TABLE discount_campaigns ADD COLUMN IF NOT EXISTS end_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
            stmt.execute("ALTER TABLE discount_campaigns ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';");
            stmt.execute("ALTER TABLE discount_campaigns ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");

            // 3. Drop obsolete tables from ERD design
            stmt.execute("DROP TABLE IF EXISTS shop_follows CASCADE;");
            stmt.execute("DROP TABLE IF EXISTS shop_promotions CASCADE;");

            log.info("Database schema migration completed successfully.");
        } catch (Exception e) {
            log.warn("Notice: Database schema migration encountered a non-fatal warning: {}", e.getMessage());
        }
    }
}
