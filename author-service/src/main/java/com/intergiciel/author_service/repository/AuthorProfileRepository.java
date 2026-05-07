package com.intergiciel.author_service.repository;

import com.intergiciel.author_service.domain.AuthorProfileEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuthorProfileRepository extends JpaRepository<AuthorProfileEntity, UUID> {
}
