package com.vic.ecom.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "return_media")
@Getter @Setter
public class ReturnMedia {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "request_id", nullable = false)
    private ReturnRequest request;
    @Column(nullable = false, length = 500) private String url;
}
