package com.vic.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String code;
    private String message;
    private String field;
    private T data;

    public ApiResponse() {
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, null, message, null, data);
    }

    public static <T> ApiResponse<T> fail(String code, String message, String field) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(false);
        response.setCode(code);
        response.setMessage(message);
        response.setField(field);
        response.setData(null);
        return response;
    }

    public static <T> ApiResponse<T> fail(String message) {
        return fail(null, message, null);
    }
}
