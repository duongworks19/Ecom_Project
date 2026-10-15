package com.vic.ecom.repository;

import com.vic.ecom.dto.CustomerDetailResponse;
import com.vic.ecom.dto.CustomerListItemResponse;
import com.vic.ecom.dto.CustomerOrderItemResponse;
import com.vic.ecom.dto.CustomerPageResponse;
import com.vic.ecom.dto.CustomerReviewItemResponse;
import com.vic.ecom.dto.CustomerSummaryResponse;
import com.vic.ecom.enums.UserStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AdminCustomerRepository {

    CustomerPageResponse<CustomerListItemResponse> findCustomers(
            String keyword,
            UserStatus statusFilter,
            int page,
            int size,
            String sortColumn,
            String sortDirection
    );

    CustomerSummaryResponse findSummary(LocalDateTime sevenDaysAgoThreshold);

    Optional<CustomerDetailResponse.Profile> findCustomerProfileById(Long customerId);

    List<CustomerDetailResponse.AddressItem> findAddressesByUserId(Long customerId);

    CustomerDetailResponse.PurchaseSummary findPurchaseSummary(Long customerId);

    CustomerPageResponse<CustomerOrderItemResponse> findCustomerOrders(Long customerId, int page, int size);

    CustomerPageResponse<CustomerReviewItemResponse> findCustomerReviews(Long customerId, int page, int size);

    int updateCustomerStatusConditionally(Long customerId, UserStatus expectedCurrentStatus, UserStatus newStatus);
}

