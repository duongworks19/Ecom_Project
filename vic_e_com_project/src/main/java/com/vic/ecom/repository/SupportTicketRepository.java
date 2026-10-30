package com.vic.ecom.repository;

import com.vic.ecom.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    List<SupportTicket> findByOrder_IdOrderByCreatedAtDesc(Long orderId);
}
