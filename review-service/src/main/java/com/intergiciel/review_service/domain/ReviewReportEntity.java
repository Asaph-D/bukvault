package com.intergiciel.review_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "review_report", uniqueConstraints = @UniqueConstraint(columnNames = { "review_id", "reporter_id" }))
public class ReviewReportEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "review_id", nullable = false)
	private ReviewEntity review;

	@Column(nullable = false)
	private UUID reporterId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private ReportReason reason;

	@Column(length = 1000)
	private String details;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	protected ReviewReportEntity() {
	}

	public ReviewReportEntity(ReviewEntity review, UUID reporterId, ReportReason reason, String details) {
		this.review = review;
		this.reporterId = reporterId;
		this.reason = reason;
		this.details = details;
	}

	public Long getId() {
		return id;
	}

	public ReviewEntity getReview() {
		return review;
	}

	public UUID getReporterId() {
		return reporterId;
	}

	public ReportReason getReason() {
		return reason;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
