package com.intergiciel.community_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "salon_message")
public class SalonMessageEntity {

	@Id
	private UUID id;

	@Column(name = "thread_id", nullable = false)
	private UUID threadId;

	@Column(name = "sender_id", nullable = false)
	private UUID senderId;

	@Column(nullable = false, length = 2000)
	private String content;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	public UUID getId() {
		return id;
	}

	public void setId(UUID id) {
		this.id = id;
	}

	public UUID getThreadId() {
		return threadId;
	}

	public void setThreadId(UUID threadId) {
		this.threadId = threadId;
	}

	public UUID getSenderId() {
		return senderId;
	}

	public void setSenderId(UUID senderId) {
		this.senderId = senderId;
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}
}
