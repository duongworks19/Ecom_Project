package com.vic.ecom.controller.seller.product;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.services.CloudinaryMediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/seller/products/media")
@RequiredArgsConstructor
public class SellerProductMediaController {
    private final CloudinaryMediaService mediaService;

    @PostMapping("/upload")
    @PreAuthorize("hasRole('VENDOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String,Object>>> upload(@RequestParam MultipartFile file,
                                                                    @RequestParam(required=false) Long productId) throws IOException {
        return ResponseEntity.ok(ApiResponse.ok("Upload media thành công", mediaService.upload(file, productId)));
    }
}
