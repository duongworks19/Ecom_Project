package com.vic.ecom.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class ShopDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FollowStatus {
        @JsonProperty("isFollowing")
        private boolean isFollowing;
        private long followerCount;

        @JsonProperty("isFollowing")
        public boolean isFollowing() {
            return isFollowing;
        }

        @JsonProperty("isFollowing")
        public void setFollowing(boolean isFollowing) {
            this.isFollowing = isFollowing;
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReviewItem {
        private Long id;
        private String customerName;
        private String productName;
        private String productImage;
        private Integer rating;
        private String comment;
        private String reply;
        private String createdAt;
    }
}
