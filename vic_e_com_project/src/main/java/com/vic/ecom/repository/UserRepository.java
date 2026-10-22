package com.vic.ecom.repository;

import com.vic.ecom.entity.User;
import com.vic.ecom.enums.UserRole;
import com.vic.ecom.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    Optional<User> findByAuthProviderAndProviderSubject(String authProvider, String providerSubject);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    boolean existsByEmailAndIdNot(String email, Long id);
    boolean existsByPhoneAndIdNot(String phone, Long id);
    boolean existsByRole(UserRole role);

    @Modifying
    @Query("UPDATE User u SET u.status = :to WHERE u.id = :id AND u.status = :from")
    int updateStatusIf(@Param("id") Long id, @Param("from") UserStatus from, @Param("to") UserStatus to);
}
