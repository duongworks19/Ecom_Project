package com.vic.ecom.controller;

import com.vic.ecom.dto.OrderDtos.CancelOrderRequest;
import com.vic.ecom.dto.OrderDtos.OrderCardDto;
import com.vic.ecom.dto.OrderDtos.OrderPageDto;
import com.vic.ecom.dto.OrderDtos.RebuyResponse;
import com.vic.ecom.dto.CheckoutDtos;
import com.vic.ecom.dto.ProfileDtos.ErrorBody;
import com.vic.ecom.services.CustomerOrderService;
import com.vic.ecom.ultis.CustomerAccountException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customer/orders")
@PreAuthorize("hasRole('CUSTOMER') or hasRole('VENDOR') or hasRole('ADMIN')")
@RequiredArgsConstructor
public class CustomerOrderController {

    private final CustomerOrderService orderService;
    private final com.vic.ecom.services.CustomerCheckoutService checkoutService;

    @PostMapping
    public ResponseEntity<CheckoutDtos.Placed> place(Authentication authentication, @RequestBody CheckoutDtos.Request request) {
        return ResponseEntity.ok(checkoutService.place(authentication, request));
    }

    @GetMapping
    public ResponseEntity<OrderPageDto> listOrders(
            Authentication authentication,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(orderService.listOrders(authentication, status, page, size));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<OrderCardDto> cancelOrder(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody(required = false) CancelOrderRequest request
    ) {
        return ResponseEntity.ok(orderService.cancelOrder(authentication, id, request));
    }

    @PostMapping("/{id}/rebuy")
    public ResponseEntity<RebuyResponse> rebuyOrder(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(orderService.rebuyOrder(authentication, id));
    }

    @ExceptionHandler(CustomerAccountException.class)
    public ResponseEntity<ErrorBody> handleCustomerException(CustomerAccountException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(new ErrorBody(ex.getStatus(), ex.getCode(), ex.getMessage(), ex.getField()));
    }
}
