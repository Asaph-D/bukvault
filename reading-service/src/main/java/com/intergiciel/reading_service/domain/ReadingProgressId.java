package com.intergiciel.reading_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ReadingProgressId implements Serializable {

	@Column(name = "user_id", nullable = false, updatable = false)
	private UUID userId;

	@Column(name = "book_id", nullable = false, updatable = false)
	private UUID bookId;

	@Enumerated(EnumType.STRING)
	@Column(name = "media_type", nullable = false, updatable = false, length = 32)
	private ReadingMediaType mediaType;
}
