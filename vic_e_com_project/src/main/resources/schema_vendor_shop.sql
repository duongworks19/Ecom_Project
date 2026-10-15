-- =============================================================================
-- VIC MART E-COMMERCE DATABASE SCHEMA: B. VENDOR & SHOP
-- Bám sát 100% sơ đồ thực thể liên kết (ERD) "B. Vendor & Shop"
-- =============================================================================

-- 1. BẢNG USERS (Người dùng hệ thống)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    role VARCHAR(30) NOT NULL DEFAULT 'CUSTOMER',  -- ENUM: 'ADMIN', 'CUSTOMER', 'VENDOR', 'SHIPPER'
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(15) UNIQUE,
    password_hash VARCHAR(255),
    auth_provider VARCHAR(20) DEFAULT 'LOCAL',
    provider_subject VARCHAR(255),
    avatar_url VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',  -- ENUM: 'ACTIVE', 'LOCKED', 'INACTIVE'
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. BẢNG VENDORS (Nhà bán hàng / Đối tác kinh doanh)
-- Quan hệ: 1 User chỉ có thể trở thành 1 Vendor (1 - 1 với users qua user_id)
-- Quan hệ: approved_by tham chiếu đến user_id của Admin (N - 1 với users)
CREATE TABLE IF NOT EXISTS vendors (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    business_name VARCHAR(255) NOT NULL,
    kyc_document_url VARCHAR(500),
    approval_status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- ENUM: 'PENDING', 'APPROVED', 'REJECTED', 'REVISION_NEEDED'
    reject_reason TEXT,
    approved_by BIGINT,

    CONSTRAINT fk_vendor_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_vendor_approved_by FOREIGN KEY (approved_by) 
        REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_approval_status ON vendors(approval_status);

-- 3. BẢNG VENDOR_VIOLATIONS (Lịch sử ghi nhận vi phạm của Vendor)
-- Quan hệ: 1 Vendor có nhiều vi phạm (1 - N với vendors)
-- Quan hệ: created_by tham chiếu đến Admin xử lý vi phạm (N - 1 với users)
CREATE TABLE IF NOT EXISTS vendor_violations (
    id BIGSERIAL PRIMARY KEY,
    vendor_id BIGINT NOT NULL,
    type VARCHAR(100) NOT NULL,
    content TEXT,
    action_taken VARCHAR(255),
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_violation_vendor FOREIGN KEY (vendor_id) 
        REFERENCES vendors(id) ON DELETE CASCADE,
    CONSTRAINT fk_violation_created_by FOREIGN KEY (created_by) 
        REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_vendor_violations_vendor_id ON vendor_violations(vendor_id);

-- 4. BẢNG SHOPS (Gian hàng của người bán trên sàn)
-- Quan hệ: 1 Vendor sở hữu 1 Shop duy nhất (1 - 1 với vendors qua vendor_id)
CREATE TABLE IF NOT EXISTS shops (
    id BIGSERIAL PRIMARY KEY,
    vendor_id BIGINT NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL UNIQUE,
    logo VARCHAR(500),
    banner VARCHAR(500),
    description TEXT,
    pickup_address VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ENUM: 'ACTIVE', 'INACTIVE', 'SUSPENDED'
    rating_avg NUMERIC(2,1) DEFAULT 0.0 CHECK (rating_avg >= 0.0 AND rating_avg <= 5.0),

    CONSTRAINT fk_shop_vendor FOREIGN KEY (vendor_id) 
        REFERENCES vendors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shops_vendor_id ON shops(vendor_id);
CREATE INDEX IF NOT EXISTS idx_shops_status ON shops(status);

-- 5. BẢNG SHOP_REVIEWS (Đánh giá gian hàng của khách hàng)
-- Quan hệ: 1 Shop nhận nhiều đánh giá từ khách hàng (1 - N với shops)
-- Quan hệ: customer_id là User vai trò Customer thực hiện đánh giá (N - 1 với users)
CREATE TABLE IF NOT EXISTS shop_reviews (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_review_shop FOREIGN KEY (shop_id) 
        REFERENCES shops(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_customer FOREIGN KEY (customer_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shop_reviews_shop_id ON shop_reviews(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_reviews_customer_id ON shop_reviews(customer_id);
