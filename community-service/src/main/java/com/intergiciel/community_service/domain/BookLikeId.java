package com.intergiciel.community_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class BookLikeId implements Serializable {

	@Column(name = "user_id")
	private UUID userId;

	@Column(name = "book_id")
	private UUID bookId;

	protected BookLikeId() {
	}

	public BookLikeId(UUID userId, UUID bookId) {
		this.userId = userId;
		this.bookId = bookId;
	}

	public UUID getUserId() {
		return userId;
	}

	public UUID getBookId() {
		return bookId;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o)
			return true;
		if (o == null || getClass() != o.getClass())
			return false;
		BookLikeId that = (BookLikeId) o;
		return Objects.equals(userId, that.userId) && Objects.equals(bookId, that.bookId);
	}

	@Override
	public int hashCode() {
		return Objects.hash(userId, bookId);
	}
}

