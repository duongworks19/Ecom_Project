package com.vic.ecom.entity;

import com.vic.ecom.enums.ReviewMediaType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "review_media")
@Getter
@Setter
public class ReviewMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private ProductReview review;

    @Column(length = 500, nullable = false)
    private String url;

    @Enumerated(EnumType.STRING)
    @Column(length = 10, nullable = false)
    private ReviewMediaType type = ReviewMediaType.IMAGE;

    public ReviewMedia() {
    }
}
