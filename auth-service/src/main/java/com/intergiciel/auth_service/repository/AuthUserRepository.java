package com.intergiciel.auth_service.repository;

import com.intergiciel.auth_service.domain.AuthUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AuthUserRepository extends JpaRepository<AuthUser, UUID> {

	Optional<AuthUser> findByEmailIgnoreCase(String email);

	boolean existsByEmailIgnoreCase(String email);
}
