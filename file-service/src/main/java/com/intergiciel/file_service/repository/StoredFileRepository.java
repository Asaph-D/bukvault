package com.intergiciel.file_service.repository;

import com.intergiciel.file_service.domain.FileKind;
import com.intergiciel.file_service.domain.StoredFileEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface StoredFileRepository extends JpaRepository<StoredFileEntity, Long> {

	Optional<StoredFileEntity> findTopByBookIdAndKindOrderByIdDesc(UUID bookId, FileKind kind);

	Optional<StoredFileEntity> findTopByOwnerUserIdAndKindOrderByIdDesc(UUID ownerUserId, FileKind kind);
}
