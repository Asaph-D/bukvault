package com.intergiciel.review_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.util.UUID;

@Entity
@Table(name = "review_helpful", uniqueConstraints = @UniqueConstraint(columnNames = { "review_id", "user_id" }))
public class ReviewHelpfulEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "review_id", nullable = false)
	private ReviewEntity review;

	@Column(nullable = false)
	private UUID userId;

	protected ReviewHelpfulEntity() {
	}

	public ReviewHelpfulEntity(ReviewEntity review, UUID userId) {
		this.review = review;
		this.userId = userId;
	}

	public Long getId() {
		return id;
	}

	public ReviewEntity getReview() {
		return review;
	}

	public UUID getUserId() {
		return userId;
	}
}
