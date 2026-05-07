package com.intergiciel.user_service.repository;

import com.intergiciel.user_service.domain.UserReaderSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserReaderSettingsRepository extends JpaRepository<UserReaderSettings, UUID> {
}
