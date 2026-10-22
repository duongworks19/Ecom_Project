package com.vic.ecom.dto;

public final class AddressDtos {

    private AddressDtos() {
    }

    public record AddressResponse(
            Long id,
            String recipientName,
            String phone,
            String streetAddress,
            String ward,
            String district,
            String province,
            boolean isDefault
    ) {
    }

    public record UpsertAddressRequest(
            String recipientName,
            String phone,
            String streetAddress,
            String ward,
            String district,
            String province,
            Boolean isDefault
    ) {
    }
}
