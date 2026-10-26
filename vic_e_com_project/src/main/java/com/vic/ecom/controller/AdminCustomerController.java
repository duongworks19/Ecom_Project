package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.CustomerDetailResponse;
import com.vic.ecom.dto.CustomerListItemResponse;
import com.vic.ecom.dto.CustomerLockRequest;
import com.vic.ecom.dto.CustomerOrderItemResponse;
import com.vic.ecom.dto.CustomerPageResponse;
import com.vic.ecom.dto.CustomerReviewItemResponse;
import com.vic.ecom.dto.CustomerStatusResponse;
import com.vic.ecom.dto.CustomerSummaryResponse;
import com.vic.ecom.services.AdminCustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/customers")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminCustomerController {

    private final AdminCustomerService adminCustomerService;

    @GetMapping
    public ResponseEntity<CustomerPageResponse<CustomerListItemResponse>> getCustomers(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "page", defaultValue = "0") Integer page,
            @RequestParam(name = "size", defaultValue = "8") Integer size,
            @RequestParam(name = "sort", required = false) String sort
    ) {
        return ResponseEntity.ok(adminCustomerService.getCustomers(keyword, status, page, size, sort));
    }

    @GetMapping("/summary")
    public ResponseEntity<CustomerSummaryResponse> getSummary() {
        return ResponseEntity.ok(adminCustomerService.getSummary());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerDetailResponse> getCustomerDetail(@PathVariable("id") Long id) {
        return ResponseEntity.ok(adminCustomerService.getCustomerDetail(id));
    }

    @GetMapping("/{id}/orders")
    public ResponseEntity<CustomerPageResponse<CustomerOrderItemResponse>> getCustomerOrders(
            @PathVariable("id") Long id,
            @RequestParam(name = "page", defaultValue = "0") Integer page,
            @RequestParam(name = "size", defaultValue = "8") Integer size
    ) {
        return ResponseEntity.ok(adminCustomerService.getCustomerOrders(id, page, size));
    }

    @GetMapping("/{id}/reviews")
    public ResponseEntity<CustomerPageResponse<CustomerReviewItemResponse>> getCustomerReviews(
            @PathVariable("id") Long id,
            @RequestParam(name = "page", defaultValue = "0") Integer page,
            @RequestParam(name = "size", defaultValue = "8") Integer size
    ) {
        return ResponseEntity.ok(adminCustomerService.getCustomerReviews(id, page, size));
    }

    @PostMapping("/{id}/lock")
    public ResponseEntity<CustomerStatusResponse> lockCustomer(
            @PathVariable("id") Long id,
            @Valid @RequestBody(required = false) CustomerLockRequest request,
            Authentication authentication
    ) {
        String reason = request != null ? request.reason() : null;
        String adminPrincipal = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(adminCustomerService.lockCustomer(id, reason, adminPrincipal));
    }

    @PostMapping("/{id}/unlock")
    public ResponseEntity<CustomerStatusResponse> unlockCustomer(
            @PathVariable("id") Long id,
            @Valid @RequestBody(required = false) CustomerLockRequest request,
            Authentication authentication
    ) {
        String reason = request != null ? request.reason() : null;
        String adminPrincipal = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(adminCustomerService.unlockCustomer(id, reason, adminPrincipal));
    }

    @PostMapping("/{id}/lock-all")
    public ResponseEntity<CustomerStatusResponse> lockAll(@PathVariable Long id, @RequestBody(required = false) CustomerLockRequest request, Authentication authentication) {
        return ResponseEntity.ok(adminCustomerService.lockUser(id, request == null ? null : request.reason(), authentication == null ? null : authentication.getName()));
    }

    @PostMapping("/{id}/unlock-all")
    public ResponseEntity<CustomerStatusResponse> unlockAll(@PathVariable Long id) {
        return ResponseEntity.ok(adminCustomerService.unlockUser(id));
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> permanentlyDelete(@PathVariable("id") Long id, @RequestParam String reason) {
        adminCustomerService.permanentlyDelete(id, reason);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail(msg));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleResponseStatus(ResponseStatusException ex) {
        String message = ex.getReason() != null ? ex.getReason() : "Request failed";
        return ResponseEntity.status(ex.getStatusCode()).body(ApiResponse.fail(message));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.fail("Invalid parameter: " + ex.getName()));
    }
}
