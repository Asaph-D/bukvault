package com.intergiciel.community_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "book_like")
public class BookLikeEntity {

	@EmbeddedId
	private BookLikeId id;

	@Column(nullable = false)
	private Instant likedAt;

	protected BookLikeEntity() {
	}

	public BookLikeEntity(BookLikeId id, Instant likedAt) {
		this.id = id;
		this.likedAt = likedAt;
	}

	public BookLikeId getId() {
		return id;
	}

	public void setId(BookLikeId id) {
		this.id = id;
	}

	public Instant getLikedAt() {
		return likedAt;
	}

	public void setLikedAt(Instant likedAt) {
		this.likedAt = likedAt;
	}
}

