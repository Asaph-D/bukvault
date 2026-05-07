package com.intergiciel.auth_service.service;

import com.intergiciel.auth_service.config.AuthProperties;
import com.intergiciel.auth_service.domain.AuthUser;
import com.intergiciel.auth_service.domain.BlacklistedJti;
import com.intergiciel.auth_service.domain.RefreshToken;
import com.intergiciel.auth_service.domain.Role;
import com.intergiciel.auth_service.repository.AuthUserRepository;
import com.intergiciel.auth_service.repository.BlacklistedJtiRepository;
import com.intergiciel.auth_service.repository.RefreshTokenRepository;
import com.intergiciel.auth_service.web.dto.AuthResponse;
import com.intergiciel.auth_service.web.dto.ChangePasswordRequest;
import com.intergiciel.auth_service.web.dto.LoginRequest;
import com.intergiciel.auth_service.web.dto.RegisterRequest;
import com.intergiciel.auth_service.web.dto.UserResponse;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class AuthService {

	private final AuthUserRepository authUserRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final BlacklistedJtiRepository blacklistedJtiRepository;
	private final JwtService jwtService;
	private final PasswordEncoder passwordEncoder;
	private final AuthProperties authProperties;

	public AuthService(AuthUserRepository authUserRepository,
			RefreshTokenRepository refreshTokenRepository,
			BlacklistedJtiRepository blacklistedJtiRepository,
			JwtService jwtService,
			PasswordEncoder passwordEncoder,
			AuthProperties authProperties) {
		this.authUserRepository = authUserRepository;
		this.refreshTokenRepository = refreshTokenRepository;
		this.blacklistedJtiRepository = blacklistedJtiRepository;
		this.jwtService = jwtService;
		this.passwordEncoder = passwordEncoder;
		this.authProperties = authProperties;
	}

	@Transactional
	public AuthResponse register(RegisterRequest request) {
		String email = normalizeEmail(request.email());
		if (authUserRepository.existsByEmailIgnoreCase(email)) {
			throw new DuplicateEmailException("Cette adresse e-mail est déjà utilisée.");
		}
		Role desired = parseObjective(request.objective());
		AuthUser user = AuthUser.builder()
				.email(email)
				.passwordHash(passwordEncoder.encode(request.password()))
				.firstName(request.firstName().trim())
				.lastName(request.lastName().trim())
				.role(desired)
				.active(true)
				.createdAt(Instant.now())
				.build();
		authUserRepository.save(user);
		return issueTokens(user, true);
	}

	@Transactional
	public AuthResponse login(LoginRequest request) {
		String email = normalizeEmail(request.email());
		AuthUser user = authUserRepository.findByEmailIgnoreCase(email)
				.orElseThrow(() -> new InvalidCredentialsException("Identifiants invalides."));
		if (!user.isActive()) {
			throw new InvalidCredentialsException("Compte désactivé.");
		}
		if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			throw new InvalidCredentialsException("Identifiants invalides.");
		}
		boolean rememberMe = request.rememberMe() != null && request.rememberMe();
		return issueTokens(user, rememberMe);
	}

	@Transactional
	public AuthResponse refresh(String refreshTokenRaw) {
		String hash = TokenHasher.sha256Hex(refreshTokenRaw);
		RefreshToken rt = refreshTokenRepository.findByTokenHashAndRevokedFalse(hash)
				.orElseThrow(() -> new InvalidTokenException("Refresh token invalide."));
		if (rt.getExpiresAt().isBefore(Instant.now())) {
			throw new InvalidTokenException("Refresh token expiré.");
		}
		AuthUser user = authUserRepository.findById(rt.getUserId())
				.orElseThrow(() -> new InvalidTokenException("Utilisateur introuvable."));
		if (!user.isActive()) {
			throw new InvalidTokenException("Compte désactivé.");
		}
		rt.setRevoked(true);
		refreshTokenRepository.save(rt);
		// refresh() reste basé sur la durée du token stockée en DB, donc la stratégie “remember me”
		// est déjà portée par le refresh token lui-même.
		return issueTokens(user, false);
	}

	@Transactional
	public void logout(UUID userId, String accessTokenRaw, String refreshTokenOptional) {
		blacklistAccessIfPresent(accessTokenRaw);
		if (refreshTokenOptional != null && !refreshTokenOptional.isBlank()) {
			String h = TokenHasher.sha256Hex(refreshTokenOptional);
			refreshTokenRepository.findByTokenHashAndRevokedFalse(h).ifPresent(rt -> {
				if (rt.getUserId().equals(userId)) {
					rt.setRevoked(true);
					refreshTokenRepository.save(rt);
				}
			});
		}
		else {
			refreshTokenRepository.revokeAllForUser(userId);
		}
	}

	@Transactional
	public void changePassword(UUID userId, String accessTokenRaw, ChangePasswordRequest request) {
		AuthUser user = authUserRepository.findById(userId)
				.orElseThrow(() -> new UserNotFoundException("Utilisateur introuvable."));
		if (!user.isActive()) {
			throw new InvalidCredentialsException("Compte désactivé.");
		}
		if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
			throw new InvalidCredentialsException("Mot de passe actuel incorrect.");
		}
		user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
		authUserRepository.save(user);
		// Après changement, toutes les sessions refresh sont révoquées.
		refreshTokenRepository.revokeAllForUser(userId);
		// Et l'access courant est blacklisté si présent.
		blacklistAccessIfPresent(accessTokenRaw);
	}

	@Transactional
	public int revokeAllSessions(UUID userId, String accessTokenRaw) {
		blacklistAccessIfPresent(accessTokenRaw);
		return refreshTokenRepository.revokeAllForUser(userId);
	}

	@Transactional(readOnly = true)
	public UserResponse getMe(UUID userId) {
		AuthUser user = authUserRepository.findById(userId)
				.orElseThrow(() -> new UserNotFoundException("Utilisateur introuvable."));
		return toUserResponse(user);
	}

	private AuthResponse issueTokens(AuthUser user, boolean rememberMe) {
		String access = jwtService.createAccessToken(
				user.getId(),
				user.getEmail(),
				user.getFirstName(),
				user.getLastName(),
				user.getRole());
		String refreshRaw = TokenHasher.generateRefreshTokenRaw();
		String hash = TokenHasher.sha256Hex(refreshRaw);
		long days = rememberMe
				? authProperties.getJwt().getRefreshTokenDaysRememberMe()
				: authProperties.getJwt().getRefreshTokenDays();
		Instant exp = Instant.now().plus(days, ChronoUnit.DAYS);
		refreshTokenRepository.save(RefreshToken.builder()
				.userId(user.getId())
				.tokenHash(hash)
				.expiresAt(exp)
				.revoked(false)
				.createdAt(Instant.now())
				.build());
		long expiresIn = authProperties.getJwt().getAccessTokenMinutes() * 60;
		return AuthResponse.of(toUserResponse(user), access, refreshRaw, expiresIn);
	}

	private UserResponse toUserResponse(AuthUser user) {
		return new UserResponse(
				user.getId(),
				user.getEmail(),
				user.getFirstName(),
				user.getLastName(),
				user.getRole(),
				user.isActive(),
				user.getCreatedAt());
	}

	private void blacklistAccessIfPresent(String accessTokenRaw) {
		if (accessTokenRaw == null || accessTokenRaw.isBlank()) {
			return;
		}
		try {
			Claims c = jwtService.parseAccessToken(accessTokenRaw);
			String jti = c.getId();
			if (jti != null && c.getExpiration() != null) {
				blacklistedJtiRepository.save(BlacklistedJti.builder()
						.jti(jti)
						.expiresAt(c.getExpiration().toInstant())
						.build());
			}
		}
		catch (JwtException | IllegalArgumentException ignored) {
			// token déjà invalide : blacklist inutile
		}
	}

	private static String normalizeEmail(String email) {
		return email.trim().toLowerCase();
	}

	private static Role parseObjective(String objective) {
		if (objective == null) {
			return Role.USER;
		}
		String o = objective.trim().toUpperCase();
		if ("AUTHOR".equals(o)) {
			return Role.AUTHOR;
		}
		// NB: ADMIN non attribuable via register
		return Role.USER;
	}
}
