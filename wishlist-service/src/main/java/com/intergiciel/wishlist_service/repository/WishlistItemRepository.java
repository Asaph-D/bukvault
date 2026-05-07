package com.intergiciel.wishlist_service.repository;

import com.intergiciel.wishlist_service.domain.WishlistItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WishlistItemRepository extends JpaRepository<WishlistItemEntity, Long> {

	List<WishlistItemEntity> findByUserIdOrderByAddedAtDesc(UUID userId);

	Optional<WishlistItemEntity> findByUserIdAndBookId(UUID userId, UUID bookId);

	void deleteByUserIdAndBookId(UUID userId, UUID bookId);

	void deleteByUserIdAndBookIdIn(UUID userId, List<UUID> bookIds);
}
