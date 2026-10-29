package com.vic.ecom.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {
    @Bean
    public Cloudinary cloudinary(
            @Value("${cloudinary.cloud-name:vicmart-cloud}") String cloudName,
            @Value("${cloudinary.api-key:1234567890}") String apiKey,
            @Value("${cloudinary.api-secret:dev_secret_key}") String apiSecret
    ) {
        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
        ));
    }
}
