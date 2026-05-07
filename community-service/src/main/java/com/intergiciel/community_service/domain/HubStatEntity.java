package com.intergiciel.community_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "community_hub_stat")
public class HubStatEntity {

	@Id
	private short id = 1;

	@Column(nullable = false)
	private int activeReaders;

	@Column(nullable = false)
	private int openSalons;

	@Column(length = 500)
	private String tagline;

	public short getId() {
		return id;
	}

	public void setId(short id) {
		this.id = id;
	}

	public int getActiveReaders() {
		return activeReaders;
	}

	public void setActiveReaders(int activeReaders) {
		this.activeReaders = activeReaders;
	}

	public int getOpenSalons() {
		return openSalons;
	}

	public void setOpenSalons(int openSalons) {
		this.openSalons = openSalons;
	}

	public String getTagline() {
		return tagline;
	}

	public void setTagline(String tagline) {
		this.tagline = tagline;
	}
}
