package com.vic.ecom.repository;

import com.vic.ecom.entity.AccountLockLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountLockLogRepository extends JpaRepository<AccountLockLog, Long> {
    List<AccountLockLog> findByUserIdOrderByCreatedAtDesc(Long userId);
}
