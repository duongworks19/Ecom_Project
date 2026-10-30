package com.vic.ecom.services;

import com.vic.ecom.enums.OrderStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AdminOrderStatusMapperTest {
    @Test
    void mapsOrderStatusesToAdminChips() {
        var ready = AdminOrderStatusMapper.map(OrderStatus.READY_TO_SHIP);
        assertEquals("waiting_confirm", ready.key());
        assertTrue(ready.attention());
        assertEquals("other", AdminOrderStatusMapper.map(null).key());
    }
}
