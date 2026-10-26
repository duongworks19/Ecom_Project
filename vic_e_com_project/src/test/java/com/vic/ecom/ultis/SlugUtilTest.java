package com.vic.ecom.ultis;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class SlugUtilTest {
    @Test void createsVietnameseSlug() {
        assertEquals("ao-so-mi", SlugUtil.toSlug("Áo sơ mi"));
    }
}
