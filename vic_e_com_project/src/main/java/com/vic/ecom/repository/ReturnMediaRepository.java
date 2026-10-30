package com.vic.ecom.repository;

import com.vic.ecom.entity.ReturnMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReturnMediaRepository extends JpaRepository<ReturnMedia, Long> {
    List<ReturnMedia> findByRequest_IdOrderByIdAsc(Long requestId);
}
