package com.vic.ecom.services;

import com.vic.ecom.dto.CustomerDetailResponse;
import com.vic.ecom.dto.CustomerListItemResponse;
import com.vic.ecom.dto.CustomerOrderItemResponse;
import com.vic.ecom.dto.CustomerPageResponse;
import com.vic.ecom.dto.CustomerReviewItemResponse;
import com.vic.ecom.dto.CustomerStatusResponse;
import com.vic.ecom.dto.CustomerSummaryResponse;
import com.vic.ecom.entity.AccountLockLog;
import com.vic.ecom.entity.User;
import com.vic.ecom.enums.AccountAction;
import com.vic.ecom.enums.UserStatus;
import com.vic.ecom.repository.AccountLockLogRepository;
import com.vic.ecom.repository.AdminCustomerRepository;
import com.vic.ecom.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminCustomerService {

    public static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final AdminCustomerRepository adminCustomerRepository;
    private final AccountLockLogRepository accountLockLogRepository;
    private final UserRepository userRepository;

    @Setter
    private Clock clock = Clock.system(VN_ZONE);

    @Transactional(readOnly = true)
    public CustomerPageResponse<CustomerListItemResponse> getCustomers(
            String keyword,
            String statusParam,
            Integer pageParam,
            Integer sizeParam,
            String sortParam
    ) {
        int page = pageParam == null ? 0 : pageParam;
        int size = sizeParam == null ? 8 : sizeParam;
        if (page < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid page parameter");
        }
        if (size <= 0 || size > 50) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Size must be between 1 and 50");
        }

        UserStatus statusFilter = parseStatusFilter(statusParam);
        SortSpec sortSpec = parseSort(sortParam);

        return adminCustomerRepository.findCustomers(
                keyword,
                statusFilter,
                page,
                size,
                sortSpec.field(),
                sortSpec.direction()
        );
    }

    @Transactional(readOnly = true)
    public CustomerSummaryResponse getSummary() {
        LocalDateTime nowVn = LocalDateTime.now(clock.withZone(VN_ZONE));
        LocalDateTime sevenDaysAgo = nowVn.minusDays(7);
        return adminCustomerRepository.findSummary(sevenDaysAgo);
    }

    @Transactional(readOnly = true)
    public CustomerDetailResponse getCustomerDetail(Long customerId) {
        CustomerDetailResponse.Profile profile = adminCustomerRepository.findCustomerProfileById(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
        List<CustomerDetailResponse.AddressItem> addresses = adminCustomerRepository.findAddressesByUserId(customerId);
        CustomerDetailResponse.PurchaseSummary purchaseSummary = adminCustomerRepository.findPurchaseSummary(customerId);
        return new CustomerDetailResponse(profile, addresses, purchaseSummary);
    }

    @Transactional(readOnly = true)
    public CustomerPageResponse<CustomerOrderItemResponse> getCustomerOrders(
            Long customerId,
            Integer pageParam,
            Integer sizeParam
    ) {
        int page = pageParam == null ? 0 : pageParam;
        int size = sizeParam == null ? 8 : sizeParam;
        validatePageAndSize(page, size);
        requireCustomerExists(customerId);
        return adminCustomerRepository.findCustomerOrders(customerId, page, size);
    }

    @Transactional(readOnly = true)
    public CustomerPageResponse<CustomerReviewItemResponse> getCustomerReviews(
            Long customerId,
            Integer pageParam,
            Integer sizeParam
    ) {
        int page = pageParam == null ? 0 : pageParam;
        int size = sizeParam == null ? 8 : sizeParam;
        validatePageAndSize(page, size);
        requireCustomerExists(customerId);
        return adminCustomerRepository.findCustomerReviews(customerId, page, size);
    }

    @Transactional
    public CustomerStatusResponse lockCustomer(Long customerId, String reason, String adminPrincipal) {
        return changeCustomerStatus(
                customerId,
                UserStatus.ACTIVE,
                UserStatus.LOCKED,
                AccountAction.LOCK,
                reason,
                adminPrincipal,
                "Customer is already locked"
        );
    }

    @Transactional
    public CustomerStatusResponse unlockCustomer(Long customerId, String reason, String adminPrincipal) {
        return changeCustomerStatus(
                customerId,
                UserStatus.LOCKED,
                UserStatus.ACTIVE,
                AccountAction.UNLOCK,
                reason,
                adminPrincipal,
                "Customer is not locked"
        );
    }

    private CustomerStatusResponse changeCustomerStatus(
            Long customerId,
            UserStatus expectedCurrentStatus,
            UserStatus targetStatus,
            AccountAction action,
            String reason,
            String adminPrincipal,
            String conflictMessage
    ) {
        String normalizedReason = reason != null ? reason.trim() : null;
        if (normalizedReason != null && normalizedReason.length() > 500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reason must not exceed 500 characters");
        }
        if (normalizedReason != null && normalizedReason.isEmpty()) {
            normalizedReason = null;
        }

        requireCustomerExists(customerId);

        int affectedRows = adminCustomerRepository.updateCustomerStatusConditionally(
                customerId,
                expectedCurrentStatus,
                targetStatus
        );
        if (affectedRows == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, conflictMessage);
        }

        User adminUser = resolveAdminUser(adminPrincipal);
        User targetCustomerRef = userRepository.getReferenceById(customerId);

        AccountLockLog lockLog = new AccountLockLog();
        lockLog.setUser(targetCustomerRef);
        lockLog.setPerformedBy(adminUser);
        lockLog.setAction(action);
        lockLog.setReason(normalizedReason);
        lockLog.setCreatedAt(LocalDateTime.now(clock.withZone(VN_ZONE)));
        accountLockLogRepository.save(lockLog);

        return new CustomerStatusResponse(customerId, targetStatus.name());
    }

    private User resolveAdminUser(String adminPrincipal) {
        if (adminPrincipal == null || adminPrincipal.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin user not authenticated");
        }
        return userRepository.findByEmail(adminPrincipal)
                .or(() -> userRepository.findByPhone(adminPrincipal))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin account not found"));
    }

    private void requireCustomerExists(Long customerId) {
        if (adminCustomerRepository.findCustomerProfileById(customerId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found");
        }
    }

    private void validatePageAndSize(int page, int size) {
        if (page < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid page parameter");
        }
        if (size <= 0 || size > 50) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Size must be between 1 and 50");
        }
    }

    private UserStatus parseStatusFilter(String statusParam) {
        if (statusParam == null || statusParam.isBlank()) {
            return null;
        }
        String normalized = statusParam.trim().toUpperCase();
        if ("ACTIVE".equals(normalized)) {
            return UserStatus.ACTIVE;
        }
        if ("LOCKED".equals(normalized)) {
            return UserStatus.LOCKED;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status parameter. Allowed values: ACTIVE, LOCKED");
    }

    private SortSpec parseSort(String sortParam) {
        if (sortParam == null || sortParam.isBlank()) {
            return new SortSpec("createdAt", "DESC");
        }
        String trimmed = sortParam.trim();
        String[] parts = trimmed.split(",");
        if (parts.length > 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid sort parameter");
        }
        String field = parts[0].trim();
        if (!"createdAt".equals(field) && !"fullName".equals(field)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid sort field. Allowed values: createdAt, fullName");
        }
        String direction;
        if (parts.length == 2 && !parts[1].isBlank()) {
            String dir = parts[1].trim().toUpperCase();
            if (!"ASC".equals(dir) && !"DESC".equals(dir)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid sort direction. Allowed values: asc, desc");
            }
            direction = dir;
        } else {
            direction = "createdAt".equals(field) ? "DESC" : "ASC";
        }
        return new SortSpec(field, direction);
    }

    private record SortSpec(String field, String direction) {
    }
}
