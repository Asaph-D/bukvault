package com.intergiciel.review_service.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "book_review", uniqueConstraints = @UniqueConstraint(columnNames = { "book_id", "user_id" }))
public class ReviewEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private UUID bookId;

	@Column(nullable = false)
	private UUID userId;

	@Column(nullable = false)
	private int rating;

	@Column(length = 200)
	private String title;

	@Column(nullable = false, length = 8000)
	private String body;

	@Column(nullable = false)
	private boolean verifiedPurchase;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	@Column(nullable = false)
	private Instant updatedAt = Instant.now();

	@OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<ReviewHelpfulEntity> helpfulVotes = new ArrayList<>();

	@OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<ReviewReportEntity> reports = new ArrayList<>();

	protected ReviewEntity() {
	}

	public ReviewEntity(UUID bookId, UUID userId, int rating, String title, String body, boolean verifiedPurchase) {
		this.bookId = bookId;
		this.userId = userId;
		this.rating = rating;
		this.title = title;
		this.body = body;
		this.verifiedPurchase = verifiedPurchase;
	}

	public Long getId() {
		return id;
	}

	public UUID getBookId() {
		return bookId;
	}

	public UUID getUserId() {
		return userId;
	}

	public int getRating() {
		return rating;
	}

	public void setRating(int rating) {
		this.rating = rating;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getBody() {
		return body;
	}

	public void setBody(String body) {
		this.body = body;
	}

	public boolean isVerifiedPurchase() {
		return verifiedPurchase;
	}

	public void setVerifiedPurchase(boolean verifiedPurchase) {
		this.verifiedPurchase = verifiedPurchase;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void touch() {
		this.updatedAt = Instant.now();
	}

	public List<ReviewHelpfulEntity> getHelpfulVotes() {
		return helpfulVotes;
	}

	public List<ReviewReportEntity> getReports() {
		return reports;
	}
}
