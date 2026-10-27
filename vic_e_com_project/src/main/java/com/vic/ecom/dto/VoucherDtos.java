package com.vic.ecom.dto;

import com.vic.ecom.entity.Voucher;
import com.vic.ecom.enums.VoucherDiscountType;
import com.vic.ecom.enums.VoucherStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class VoucherDtos {

    private VoucherDtos() {
    }

    public record CreateRequest(
            @NotBlank(message = "Mã voucher không được để trống")
            String code,

            @NotNull(message = "Loại giảm giá không được để trống")
            VoucherDiscountType discountType,

            @NotNull(message = "Giá trị giảm giá không được để trống")
            @DecimalMin(value = "0.01", message = "Giá trị giảm giá phải lớn hơn 0")
            BigDecimal value,

            BigDecimal maxDiscount,

            BigDecimal minOrderAmount,

            @NotNull(message = "Lượt sử dụng không được để trống")
            @Min(value = 1, message = "Lượt sử dụng tối đa phải từ 1 trở lên")
            Integer usageLimit,

            LocalDateTime startAt,

            @NotNull(message = "Thời gian kết thúc không được để trống")
            LocalDateTime endAt
    ) {
    }

    public record UpdateRequest(
            @NotBlank(message = "Mã voucher không được để trống")
            String code,

            @NotNull(message = "Loại giảm giá không được để trống")
            VoucherDiscountType discountType,

            @NotNull(message = "Giá trị giảm giá không được để trống")
            @DecimalMin(value = "0.01", message = "Giá trị giảm giá phải lớn hơn 0")
            BigDecimal value,

            BigDecimal maxDiscount,

            BigDecimal minOrderAmount,

            @NotNull(message = "Lượt sử dụng không được để trống")
            @Min(value = 1, message = "Lượt sử dụng tối đa phải từ 1 trở lên")
            Integer usageLimit,

            LocalDateTime startAt,

            @NotNull(message = "Thời gian kết thúc không được để trống")
            LocalDateTime endAt
    ) {
    }

    public record StatusRequest(
            @NotNull(message = "Trạng thái không được để trống")
            VoucherStatus status
    ) {
    }

    @Builder
    public record Response(
            Long id,
            String code,
            VoucherDiscountType discountType,
            BigDecimal value,
            BigDecimal maxDiscount,
            BigDecimal minOrderAmount,
            Integer usageLimit,
            Integer usedCount,
            LocalDateTime startAt,
            LocalDateTime endAt,
            VoucherStatus status,
            LocalDateTime createdAt,
            String displayStatus
    ) {
        public static Response from(Voucher v, String displayStatus) {
            return new Response(
                    v.getId(),
                    v.getCode(),
                    v.getDiscountType(),
                    v.getValue(),
                    v.getMaxDiscount(),
                    v.getMinOrderAmount(),
                    v.getUsageLimit(),
                    v.getUsedCount(),
                    v.getStartAt(),
                    v.getEndAt(),
                    v.getStatus(),
                    v.getCreatedAt(),
                    displayStatus
            );
        }
    }
}
