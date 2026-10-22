package com.vic.ecom.ultis;

import lombok.Getter;

@Getter
public class CustomerAccountException extends RuntimeException {

    private final int status;
    private final String code;
    private final String field;

    public CustomerAccountException(int status, String code, String message, String field) {
        super(message);
        this.status = status;
        this.code = code;
        this.field = field;
    }

    public static CustomerAccountException badRequest(String code, String message, String field) {
        return new CustomerAccountException(400, code, message, field);
    }

    public static CustomerAccountException unauthorized(String message) {
        return new CustomerAccountException(401, "UNAUTHORIZED", message, null);
    }

    public static CustomerAccountException forbidden(String message) {
        return new CustomerAccountException(403, "FORBIDDEN", message, null);
    }

    public static CustomerAccountException notFound(String code, String message) {
        return new CustomerAccountException(404, code, message, null);
    }

    public static CustomerAccountException conflict(String code, String message, String field) {
        return new CustomerAccountException(409, code, message, field);
    }

    public static CustomerAccountException unprocessable(String code, String message, String field) {
        return new CustomerAccountException(422, code, message, field);
    }
}
