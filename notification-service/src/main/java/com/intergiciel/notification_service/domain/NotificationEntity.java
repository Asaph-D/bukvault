package com.intergiciel.notification_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "app_notification")
public class NotificationEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private UUID userId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private NotificationKind kind;

	@Column(nullable = false, length = 200)
	private String title;

	@Column(nullable = false, length = 4000)
	private String message;

	@Column(nullable = false)
	private boolean readFlag;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	protected NotificationEntity() {
	}

	public NotificationEntity(UUID userId, NotificationKind kind, String title, String message, boolean readFlag) {
		this.userId = userId;
		this.kind = kind;
		this.title = title;
		this.message = message;
		this.readFlag = readFlag;
	}

	public Long getId() {
		return id;
	}

	public UUID getUserId() {
		return userId;
	}

	public NotificationKind getKind() {
		return kind;
	}

	public String getTitle() {
		return title;
	}

	public String getMessage() {
		return message;
	}

	public boolean isReadFlag() {
		return readFlag;
	}

	public void setReadFlag(boolean readFlag) {
		this.readFlag = readFlag;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
