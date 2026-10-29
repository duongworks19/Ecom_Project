package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.services.CloudinaryMediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaUploadController {
    private final CloudinaryMediaService mediaService;

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "general") String folder) throws IOException {
        String safeFolder = folder.replaceAll("[^a-zA-Z0-9/_-]", "");
        String url = mediaService.uploadImage(file, "vicmart/" + (safeFolder.isBlank() ? "general" : safeFolder), 5L * 1024 * 1024);
        return ResponseEntity.ok(ApiResponse.ok("Upload ảnh thành công", Map.of("url", url)));
    }
}
