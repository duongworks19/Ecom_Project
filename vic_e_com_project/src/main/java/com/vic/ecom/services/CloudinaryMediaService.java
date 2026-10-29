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
        String type = contentType.startsWith("video/") ? "VIDEO" : "IMAGE";
        try {
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "resource_type", "auto", "folder", "vicmart/products/" + (productId == null ? "temp" : productId)));
            return Map.of("url", result.get("secure_url"), "type", type, "publicId", result.get("public_id"));
        } catch (Exception ex) {
            String fallbackUrl = "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80";
            return Map.of("url", fallbackUrl, "type", type, "publicId", "dev-" + System.currentTimeMillis());
        }
    }

    public String uploadImage(MultipartFile file, String folder, long maxBytes) throws IOException {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("File không được để trống");
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!contentType.equals("image/jpeg") && !contentType.equals("image/png") && !contentType.equals("image/webp")) {
            throw new IllegalArgumentException("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP");
        }
        if (file.getSize() > maxBytes) throw new IllegalArgumentException("File vượt quá dung lượng cho phép");
        Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "resource_type", "image", "folder", folder));
        return String.valueOf(result.get("secure_url"));
    }
}
