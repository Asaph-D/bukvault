package com.intergiciel.auth_service.repository;

import com.intergiciel.auth_service.domain.BlacklistedJti;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;

public interface BlacklistedJtiRepository extends JpaRepository<BlacklistedJti, String> {

	void deleteByExpiresAtBefore(Instant instant);
}
