package com.intergiciel.wishlist_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "wishlist_item", uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "book_id" }))
public class WishlistItemEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private UUID userId;

	@Column(nullable = false)
	private UUID bookId;

	@Column(nullable = false)
	private Instant addedAt = Instant.now();

	protected WishlistItemEntity() {
	}

	public WishlistItemEntity(UUID userId, UUID bookId) {
		this.userId = userId;
		this.bookId = bookId;
	}

	public Long getId() {
		return id;
	}

	public UUID getUserId() {
		return userId;
	}

	public UUID getBookId() {
		return bookId;
	}

	public Instant getAddedAt() {
		return addedAt;
	}
}
