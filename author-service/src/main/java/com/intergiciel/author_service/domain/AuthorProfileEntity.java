package com.intergiciel.author_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "author_profile")
public class AuthorProfileEntity {

	@Id
	private UUID userId;

	@Column(length = 200)
	private String penName;

	@Column(length = 500)
	private String website;

	@Column(length = 4000)
	private String bio;

	protected AuthorProfileEntity() {
	}

	public AuthorProfileEntity(UUID userId) {
		this.userId = userId;
	}

	public UUID getUserId() {
		return userId;
	}

	public String getPenName() {
		return penName;
	}

	public void setPenName(String penName) {
		this.penName = penName;
	}

	public String getWebsite() {
		return website;
	}

	public void setWebsite(String website) {
		this.website = website;
	}

	public String getBio() {
		return bio;
	}

	public void setBio(String bio) {
		this.bio = bio;
	}
}
