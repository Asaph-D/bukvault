package com.intergiciel.file_service.domain;

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
@Table(name = "stored_file")
public class StoredFileEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(length = 128)
	private String originalFilename;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private FileKind kind;

	@Column(nullable = false, length = 128)
	private String mimeType;

	@Column(nullable = false)
	private long sizeBytes;

	@Column(nullable = false, length = 512)
	private String storageKey;

	@Column
	private UUID bookId;

	@Column
	private UUID ownerUserId;

	@Column(nullable = false)
	private UUID uploadedBy;

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	protected StoredFileEntity() {
	}

	public StoredFileEntity(String originalFilename, FileKind kind, String mimeType, long sizeBytes,
			String storageKey, UUID bookId, UUID ownerUserId, UUID uploadedBy) {
		this.originalFilename = originalFilename;
		this.kind = kind;
		this.mimeType = mimeType;
		this.sizeBytes = sizeBytes;
		this.storageKey = storageKey;
		this.bookId = bookId;
		this.ownerUserId = ownerUserId;
		this.uploadedBy = uploadedBy;
	}

	public Long getId() {
		return id;
	}

	public String getOriginalFilename() {
		return originalFilename;
	}

	public FileKind getKind() {
		return kind;
	}

	public String getMimeType() {
		return mimeType;
	}

	public long getSizeBytes() {
		return sizeBytes;
	}

	public String getStorageKey() {
		return storageKey;
	}

	public UUID getBookId() {
		return bookId;
	}

	public UUID getOwnerUserId() {
		return ownerUserId;
	}

	public UUID getUploadedBy() {
		return uploadedBy;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
