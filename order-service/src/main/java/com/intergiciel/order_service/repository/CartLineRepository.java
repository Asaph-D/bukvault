package com.intergiciel.order_service.repository;

import com.intergiciel.order_service.domain.CartLineEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CartLineRepository extends JpaRepository<CartLineEntity, Long> {

	List<CartLineEntity> findByUserIdOrderById(UUID userId);

	Optional<CartLineEntity> findByUserIdAndBookId(UUID userId, UUID bookId);

	void deleteByUserId(UUID userId);

	long countByUserId(UUID userId);
}
