package com.intergiciel.community_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "community_thread")
public class CommunityThreadEntity {

	@Id
	private UUID id;

	@Column(nullable = false, length = 80)
	private String channel;

	@Column(nullable = false, length = 500)
	private String title;

	@Column(nullable = false)
	private boolean hot;

	@Column(nullable = false)
	private int participantCount;

	@Column(nullable = false, length = 80)
	private String lastActivityLabel;

	@Column(name = "sort_index", nullable = false)
	private int sortIndex;

	public UUID getId() {
		return id;
	}

	public void setId(UUID id) {
		this.id = id;
	}

	public String getChannel() {
		return channel;
	}

	public void setChannel(String channel) {
		this.channel = channel;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public boolean isHot() {
		return hot;
	}

	public void setHot(boolean hot) {
		this.hot = hot;
	}

	public int getParticipantCount() {
		return participantCount;
	}

	public void setParticipantCount(int participantCount) {
		this.participantCount = participantCount;
	}

	public String getLastActivityLabel() {
		return lastActivityLabel;
	}

	public void setLastActivityLabel(String lastActivityLabel) {
		this.lastActivityLabel = lastActivityLabel;
	}

	public int getSortIndex() {
		return sortIndex;
	}

	public void setSortIndex(int sortIndex) {
		this.sortIndex = sortIndex;
	}
}
