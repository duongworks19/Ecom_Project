package com.vic.ecom.repository;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ShipperPurgeRepository {
    private final EntityManager entityManager;

    public void deleteAllOwnedData(Long shipperId, Long userId) {
        entityManager.createNativeQuery("delete from delivery_failures where shipment_id in (select id from shipments where shipper_id = :id)")
                .setParameter("id", shipperId).executeUpdate();
        entityManager.createNativeQuery("delete from shipment_events where shipment_id in (select id from shipments where shipper_id = :id)")
                .setParameter("id", shipperId).executeUpdate();
        entityManager.createNativeQuery("delete from shipments where shipper_id = :id")
                .setParameter("id", shipperId).executeUpdate();
        entityManager.createNativeQuery("update shipments set assigned_by = null where assigned_by = :id")
                .setParameter("id", userId).executeUpdate();
        entityManager.createNativeQuery("delete from account_lock_logs where user_id = :id or performed_by = :id")
                .setParameter("id", userId).executeUpdate();
        entityManager.createNativeQuery("delete from login_history where user_id = :id")
                .setParameter("id", userId).executeUpdate();
        entityManager.createNativeQuery("delete from password_reset_tokens where user_id = :id")
                .setParameter("id", userId).executeUpdate();
        entityManager.createNativeQuery("delete from addresses where user_id = :id")
                .setParameter("id", userId).executeUpdate();
        entityManager.createNativeQuery("delete from carts where user_id = :id")
                .setParameter("id", userId).executeUpdate();
        entityManager.createNativeQuery("delete from voucher_usages where user_id = :id")
                .setParameter("id", userId).executeUpdate();
        entityManager.createNativeQuery("delete from review_replies where user_id = :id")
                .setParameter("id", userId).executeUpdate();
        entityManager.createNativeQuery("delete from shipper_profiles where id = :id")
                .setParameter("id", shipperId).executeUpdate();
        entityManager.createNativeQuery("delete from users where id = :id")
                .setParameter("id", userId).executeUpdate();
    }
}
