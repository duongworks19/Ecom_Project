package com.vic.ecom.config;

import com.vic.ecom.services.CustomerProfileService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class AvatarResourceConfig implements WebMvcConfigurer {

    @Value("${app.upload.avatar-dir:" + CustomerProfileService.DEFAULT_AVATAR_UPLOAD_DIR + "}")
    private String avatarUploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(avatarUploadDir).toAbsolutePath().normalize();
        String locationUri = uploadPath.toUri().toString();
        if (!locationUri.endsWith("/")) {
            locationUri = locationUri + "/";
        }
        registry.addResourceHandler("/uploads/avatars/**")
                .addResourceLocations(locationUri);
    }
}
