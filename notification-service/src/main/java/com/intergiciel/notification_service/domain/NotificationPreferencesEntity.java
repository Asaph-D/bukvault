package com.intergiciel.notification_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "notification_preferences")
public class NotificationPreferencesEntity {

	@Id
	private UUID userId;

	@Column(nullable = false)
	private boolean emailEnabled = true;

	@Column(nullable = false)
	private boolean inAppEnabled = true;

	@Column(nullable = false)
	private boolean marketingEnabled = false;

	protected NotificationPreferencesEntity() {
	}

	public NotificationPreferencesEntity(UUID userId) {
		this.userId = userId;
	}

	public UUID getUserId() {
		return userId;
	}

	public boolean isEmailEnabled() {
		return emailEnabled;
	}

	public void setEmailEnabled(boolean emailEnabled) {
		this.emailEnabled = emailEnabled;
	}

	public boolean isInAppEnabled() {
		return inAppEnabled;
	}

	public void setInAppEnabled(boolean inAppEnabled) {
		this.inAppEnabled = inAppEnabled;
	}

	public boolean isMarketingEnabled() {
		return marketingEnabled;
	}

	public void setMarketingEnabled(boolean marketingEnabled) {
		this.marketingEnabled = marketingEnabled;
	}
}
