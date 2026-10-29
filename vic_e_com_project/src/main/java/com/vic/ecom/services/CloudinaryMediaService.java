package com.vic.ecom.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryMediaService {
    private final Cloudinary cloudinary;
    public CloudinaryMediaService(Cloudinary cloudinary) { this.cloudinary = cloudinary; }

    public Map<String, Object> upload(MultipartFile file, Long productId) throws IOException {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("File không được để trống");
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!contentType.startsWith("image/") && !contentType.startsWith("video/"))
            throw new IllegalArgumentException("Chỉ hỗ trợ file ảnh hoặc video");
        long max = contentType.startsWith("video/") ? 50L * 1024 * 1024 : 5L * 1024 * 1024;
        if (file.getSize() > max) throw new IllegalArgumentException("File vượt quá dung lượng cho phép");
        Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "resource_type", "auto", "folder", "vicmart/products/" + (productId == null ? "temp" : productId)));
        String type = contentType.startsWith("video/") ? "VIDEO" : "IMAGE";
        return Map.of("url", result.get("secure_url"), "type", type, "publicId", result.get("public_id"));
    }
}
