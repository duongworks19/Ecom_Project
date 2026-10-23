package com.vic.ecom.controller;

import com.vic.ecom.dto.AddressDtos.AddressResponse;
import com.vic.ecom.dto.AddressDtos.UpsertAddressRequest;
import com.vic.ecom.dto.ProfileDtos.ErrorBody;
import com.vic.ecom.services.CustomerAddressService;
import com.vic.ecom.ultis.CustomerAccountException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer/addresses")
@PreAuthorize("hasRole('CUSTOMER') or hasRole('VENDOR') or hasRole('ADMIN')")
@RequiredArgsConstructor
public class CustomerAddressController {

    private final CustomerAddressService addressService;

    @GetMapping
    public ResponseEntity<List<AddressResponse>> listAddresses(Authentication authentication) {
        return ResponseEntity.ok(addressService.listAddresses(authentication));
    }

    @PostMapping
    public ResponseEntity<AddressResponse> createAddress(
            Authentication authentication,
            @RequestBody(required = false) UpsertAddressRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(addressService.createAddress(authentication, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AddressResponse> updateAddress(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody(required = false) UpsertAddressRequest request
    ) {
        return ResponseEntity.ok(addressService.updateAddress(authentication, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAddress(
            Authentication authentication,
            @PathVariable Long id
    ) {
        addressService.deleteAddress(authentication, id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/default")
    public ResponseEntity<AddressResponse> setDefaultAddress(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(addressService.setDefaultAddress(authentication, id));
    }

    @ExceptionHandler(CustomerAccountException.class)
    public ResponseEntity<ErrorBody> handleCustomerException(CustomerAccountException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(new ErrorBody(ex.getStatus(), ex.getCode(), ex.getMessage(), ex.getField()));
    }
}
