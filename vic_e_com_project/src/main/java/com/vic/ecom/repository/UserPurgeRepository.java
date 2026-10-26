package com.vic.ecom.repository;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class UserPurgeRepository {
    private final EntityManager entityManager;

    public void deletePersonalData(Long userId) {
        execute("delete from review_replies where user_id = :id", userId);
        execute("delete from product_reviews where customer_id = :id", userId);
        execute("delete from addresses where user_id = :id", userId);
        execute("delete from carts where user_id = :id", userId);
        execute("delete from voucher_usages where user_id = :id", userId);
        execute("delete from login_history where user_id = :id", userId);
        execute("delete from password_reset_tokens where user_id = :id", userId);
        execute("delete from account_lock_logs where user_id = :id or performed_by = :id", userId);
        execute("delete from shipper_profiles where user_id = :id", userId);
        execute("delete from vendors where user_id = :id", userId);
        execute("delete from users where id = :id", userId);
    }

    private void execute(String sql, Long id) {
        entityManager.createNativeQuery(sql).setParameter("id", id).executeUpdate();
    }
}
