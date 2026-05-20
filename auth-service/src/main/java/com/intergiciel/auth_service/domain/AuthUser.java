package com.intergiciel.auth_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
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
@Table(name = "auth_users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthUser {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, unique = true, length = 320)
	private String email;

	@Column(name = "password_hash")
	private String passwordHash;

	@Enumerated(EnumType.STRING)
	@Column(name = "auth_provider", nullable = false, length = 16)
	private AuthProvider authProvider;

	@Column(name = "google_sub", unique = true, length = 64)
	private String googleSub;

	@Column(name = "email_verified", nullable = false)
	private boolean emailVerified;

	@Column(name = "email_verification_token", length = 64)
	private String emailVerificationToken;

	@Column(name = "email_verification_expires_at")
	private Instant emailVerificationExpiresAt;

	@Column(name = "terms_accepted_at")
	private Instant termsAcceptedAt;

	@Column(name = "first_name", nullable = false, length = 120)
	private String firstName;

	@Column(name = "last_name", nullable = false, length = 120)
	private String lastName;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private Role role;

	@Column(name = "active", nullable = false)
	private boolean active;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;
}
