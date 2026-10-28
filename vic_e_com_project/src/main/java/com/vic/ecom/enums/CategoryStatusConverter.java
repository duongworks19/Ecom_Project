package com.vic.ecom.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Đọc trạng thái danh mục linh hoạt từ DB (VISIBLE/HIDDEN/ACTIVE/INACTIVE/1/0/null...)
 * để dữ liệu cũ không làm sập API danh mục.
 */
@Converter
public class CategoryStatusConverter implements AttributeConverter<CategoryStatus, String> {

    @Override
    public String convertToDatabaseColumn(CategoryStatus attribute) {
        return attribute == null ? CategoryStatus.VISIBLE.name() : attribute.name();
    }

    @Override
    public CategoryStatus convertToEntityAttribute(String dbData) {
        if (dbData == null) return CategoryStatus.VISIBLE;
        String v = dbData.trim().toUpperCase();
        return switch (v) {
            case "HIDDEN", "INACTIVE", "DISABLED", "0", "FALSE" -> CategoryStatus.HIDDEN;
            default -> CategoryStatus.VISIBLE;
        };
    }
}
