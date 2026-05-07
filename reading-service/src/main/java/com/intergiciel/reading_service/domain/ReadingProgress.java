package com.intergiciel.reading_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "reading_progress")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReadingProgress {

	@EmbeddedId
	private ReadingProgressId id;

	/**
	 * JSON libre : page, pourcentage, offset EPUB (CFI), secondes audio, etc.
	 */
	@Lob
	@JdbcTypeCode(SqlTypes.LONGVARCHAR)
	@Column(name = "position_json", nullable = false)
	private String positionJson;

	@Column(name = "device_id", length = 128)
	private String deviceId;

	@Column(name = "server_updated_at", nullable = false)
	private Instant serverUpdatedAt;

	@Column(name = "client_updated_at")
	private Instant clientUpdatedAt;
}
