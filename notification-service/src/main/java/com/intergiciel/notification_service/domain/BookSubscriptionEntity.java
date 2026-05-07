package com.intergiciel.notification_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "book_subscription")
public class BookSubscriptionEntity {

	@EmbeddedId
	private BookSubscriptionId id;

	@Column(nullable = false)
	private Instant createdAt;

	protected BookSubscriptionEntity() {
	}

	public BookSubscriptionEntity(BookSubscriptionId id, Instant createdAt) {
		this.id = id;
		this.createdAt = createdAt;
	}

	public BookSubscriptionId getId() {
		return id;
	}

	public void setId(BookSubscriptionId id) {
		this.id = id;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}
}

