package com.vic.ecom.controller;

import com.vic.ecom.dto.ProfileDtos.AvatarResponse;
import com.vic.ecom.dto.ProfileDtos.ErrorBody;
import com.vic.ecom.dto.ProfileDtos.ProfileResponse;
import com.vic.ecom.dto.ProfileDtos.UpdateProfileRequest;
import com.vic.ecom.services.CustomerProfileService;
import com.vic.ecom.ultis.CustomerAccountException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/customer/profile")
@PreAuthorize("hasRole('CUSTOMER')")
@RequiredArgsConstructor
public class CustomerProfileController {

    private final CustomerProfileService profileService;

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(Authentication authentication) {
        return ResponseEntity.ok(profileService.getProfile(authentication));
    }

    @PutMapping
    public ResponseEntity<ProfileResponse> updateProfile(
            Authentication authentication,
            @RequestBody(required = false) UpdateProfileRequest request
    ) {
        return ResponseEntity.ok(profileService.updateProfile(authentication, request));
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AvatarResponse> uploadAvatar(
            Authentication authentication,
            @RequestParam(value = "file", required = false) MultipartFile file
    ) {
        return ResponseEntity.ok(profileService.updateAvatar(authentication, file));
    }

    @ExceptionHandler(CustomerAccountException.class)
    public ResponseEntity<ErrorBody> handleCustomerException(CustomerAccountException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(new ErrorBody(ex.getStatus(), ex.getCode(), ex.getMessage(), ex.getField()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorBody> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(422)
                .body(new ErrorBody(422, "AVATAR_TOO_LARGE", "Dung lượng ảnh tối đa là 1MB", "file"));
    }
}
