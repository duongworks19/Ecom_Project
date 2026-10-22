package com.vic.ecom.ultis;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TempPasswordTest {
    @Test
    void generatesStrongNonConfusingPasswords() {
        for (int i = 0; i < 300; i++) {
            String password = TempPassword.generate();
            assertEquals(12, password.length());
            assertTrue(password.matches(".*[A-Z].*"));
            assertTrue(password.matches(".*[a-z].*"));
            assertTrue(password.matches(".*\\d.*"));
            assertFalse(password.matches(".*[0OlI1].*"));
        }
    }
}
