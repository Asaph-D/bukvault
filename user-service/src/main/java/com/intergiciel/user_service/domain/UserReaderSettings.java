package com.intergiciel.user_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_reader_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserReaderSettings {

	@Id
	@Column(name = "user_id")
	private UUID userId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private ThemePreference theme;

	@Enumerated(EnumType.STRING)
	@Column(name = "ui_density", nullable = false, length = 16)
	private UiDensity uiDensity;

	/** Code langue UI optionnel (fr, en…) ; null = suivre le profil / navigateur. */
	@Column(name = "locale_override", length = 16)
	private String localeOverride;

	@Column(name = "notify_orders", nullable = false)
	private boolean notifyOrders;

	@Column(name = "notify_promotions", nullable = false)
	private boolean notifyPromotions;

	@Column(name = "notify_social", nullable = false)
	private boolean notifySocial;

	@Enumerated(EnumType.STRING)
	@Column(name = "community_visibility", nullable = false, length = 24)
	private CommunityVisibility communityVisibility;

	@Column(name = "allow_direct_messages", nullable = false)
	private boolean allowDirectMessages;

	@Enumerated(EnumType.STRING)
	@Column(name = "reader_home_default", nullable = false, length = 24)
	private ReaderHomeDefault readerHomeDefault;

	@Column(name = "library_show_progress", nullable = false)
	private boolean libraryShowProgress;

	@Column(name = "reduce_motion", nullable = false)
	private boolean reduceMotion;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;
}
