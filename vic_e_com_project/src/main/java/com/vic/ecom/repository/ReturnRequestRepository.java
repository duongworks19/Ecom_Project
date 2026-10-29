package com.vic.ecom.repository;

import com.vic.ecom.entity.ReturnRequest;
import com.vic.ecom.enums.ReturnRequestStatus;
import com.vic.ecom.enums.ReturnRequestType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {
    List<ReturnRequest> findByTypeAndStatusAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            ReturnRequestType type, ReturnRequestStatus status, LocalDateTime from, LocalDateTime to);
}
