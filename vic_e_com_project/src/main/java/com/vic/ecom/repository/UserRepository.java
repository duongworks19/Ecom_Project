package com.vic.ecom.repository;

import com.vic.ecom.entity.User;
import com.vic.ecom.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    Optional<User> findByAuthProviderAndProviderSubject(String authProvider, String providerSubject);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    boolean existsByRole(UserRole role);
}
