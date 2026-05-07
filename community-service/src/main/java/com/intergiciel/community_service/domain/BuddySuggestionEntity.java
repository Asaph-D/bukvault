package com.intergiciel.community_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "buddy_suggestion")
public class BuddySuggestionEntity {

	@Id
	private UUID id;

	/** Lecteur pour qui la suggestion est affichée */
	@Column(name = "viewer_user_id", nullable = false)
	private UUID viewerUserId;

	@Column(nullable = false, length = 120)
	private String displayName;

	@Column(nullable = false)
	private int matchPercent;

	@Column(nullable = false, length = 200)
	private String readingHint;

	@Column(name = "sort_index", nullable = false)
	private int sortIndex;

	public UUID getId() {
		return id;
	}

	public void setId(UUID id) {
		this.id = id;
	}

	public UUID getViewerUserId() {
		return viewerUserId;
	}

	public void setViewerUserId(UUID viewerUserId) {
		this.viewerUserId = viewerUserId;
	}

	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}

	public int getMatchPercent() {
		return matchPercent;
	}

	public void setMatchPercent(int matchPercent) {
		this.matchPercent = matchPercent;
	}

	public String getReadingHint() {
		return readingHint;
	}

	public void setReadingHint(String readingHint) {
		this.readingHint = readingHint;
	}

	public int getSortIndex() {
		return sortIndex;
	}

	public void setSortIndex(int sortIndex) {
		this.sortIndex = sortIndex;
	}
}
