package com.intergiciel.auth_service.service;

import com.intergiciel.auth_service.config.AppProperties;
import com.intergiciel.auth_service.config.AuthProperties;
import com.intergiciel.auth_service.domain.AuthProvider;
import com.intergiciel.auth_service.domain.AuthUser;
import com.intergiciel.auth_service.domain.BlacklistedJti;
import com.intergiciel.auth_service.domain.RefreshToken;
import com.intergiciel.auth_service.domain.Role;
import com.intergiciel.auth_service.integration.AuthNotificationClient;
import com.intergiciel.auth_service.repository.AuthUserRepository;
import com.intergiciel.auth_service.repository.BlacklistedJtiRepository;
import com.intergiciel.auth_service.repository.RefreshTokenRepository;
import com.intergiciel.auth_service.service.GoogleTokenVerifierService.GoogleProfile;
import com.intergiciel.auth_service.web.dto.AuthResponse;
import com.intergiciel.auth_service.web.dto.ChangePasswordRequest;
import com.intergiciel.auth_service.web.dto.GoogleAuthRequest;
import com.intergiciel.auth_service.web.dto.LoginRequest;
import com.intergiciel.auth_service.web.dto.MessageResponse;
import com.intergiciel.auth_service.web.dto.RegisterRequest;
import com.intergiciel.auth_service.web.dto.ResendVerificationRequest;
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

	private static final int VERIFICATION_TOKEN_HOURS = 24;
	private static final long VERIFICATION_TOKEN_SECONDS = VERIFICATION_TOKEN_HOURS * 60L * 60L;

	private final AuthUserRepository authUserRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final BlacklistedJtiRepository blacklistedJtiRepository;
	private final JwtService jwtService;
	private final PasswordEncoder passwordEncoder;
	private final AuthProperties authProperties;
	private final AppProperties appProperties;
	private final GoogleTokenVerifierService googleTokenVerifier;
	private final AuthNotificationClient authNotificationClient;

	public AuthService(AuthUserRepository authUserRepository,
			RefreshTokenRepository refreshTokenRepository,
			BlacklistedJtiRepository blacklistedJtiRepository,
			JwtService jwtService,
			PasswordEncoder passwordEncoder,
			AuthProperties authProperties,
			AppProperties appProperties,
			GoogleTokenVerifierService googleTokenVerifier,
			AuthNotificationClient authNotificationClient) {
		this.authUserRepository = authUserRepository;
		this.refreshTokenRepository = refreshTokenRepository;
		this.blacklistedJtiRepository = blacklistedJtiRepository;
		this.jwtService = jwtService;
		this.passwordEncoder = passwordEncoder;
		this.authProperties = authProperties;
		this.appProperties = appProperties;
		this.googleTokenVerifier = googleTokenVerifier;
		this.authNotificationClient = authNotificationClient;
	}

	@Transactional
	public AuthResponse register(RegisterRequest request) {
		if (!request.termsAccepted()) {
			throw new IllegalArgumentException("Vous devez accepter les conditions d’utilisation.");
		}
		String email = normalizeEmail(request.email());
		if (authUserRepository.existsByEmailIgnoreCase(email)) {
			throw new DuplicateEmailException("Cette adresse e-mail est déjà utilisée.");
		}
		Role desired = parseObjective(request.objective());
		Instant now = Instant.now();
		AuthUser user = AuthUser.builder()
				.email(email)
				.passwordHash(passwordEncoder.encode(request.password()))
				.firstName(request.firstName().trim())
				.lastName(request.lastName().trim())
				.role(desired)
				.active(true)
				.authProvider(AuthProvider.LOCAL)
				.emailVerified(false)
				.emailVerificationToken(null)
				.emailVerificationExpiresAt(null)
				.termsAcceptedAt(now)
				.createdAt(now)
				.build();
		authUserRepository.save(user);
		sendVerificationEmail(user);
		return AuthResponse.pendingEmailVerification(toUserResponse(user));
	}

	@Transactional
	public AuthResponse login(LoginRequest request) {
		String email = normalizeEmail(request.email());
		AuthUser user = authUserRepository.findByEmailIgnoreCase(email)
				.orElseThrow(() -> new UserNotFoundException(
						"Aucun compte n'est associé à cette adresse e-mail. Veuillez utiliser une autre adresse ou créer un nouveau compte."));
		if (!user.isActive()) {
			throw new InvalidCredentialsException("Compte désactivé.");
		}
		if (user.getPasswordHash() == null
				|| !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			throw new InvalidCredentialsException("Identifiants invalides.");
		}
		ensureEmailVerifiedForLocal(user);
		boolean rememberMe = request.rememberMe() != null && request.rememberMe();
		return issueTokens(user, rememberMe);
	}

	@Transactional
	public AuthResponse googleAuth(GoogleAuthRequest request) {
		GoogleProfile profile = googleTokenVerifier.verify(request.idToken());
		boolean rememberMe = request.rememberMe() != null && request.rememberMe();

		var byGoogle = authUserRepository.findByGoogleSub(profile.sub());
		if (byGoogle.isPresent()) {
			AuthUser user = byGoogle.get();
			ensureActive(user);
			return issueTokens(user, rememberMe);
		}

		var byEmail = authUserRepository.findByEmailIgnoreCase(profile.email());
		if (byEmail.isPresent()) {
			AuthUser user = byEmail.get();
			ensureActive(user);
			if (user.getGoogleSub() == null) {
				user.setGoogleSub(profile.sub());
				user.setEmailVerified(true);
				user.setEmailVerificationToken(null);
				user.setEmailVerificationExpiresAt(null);
				authUserRepository.save(user);
			}
			else if (!profile.sub().equals(user.getGoogleSub())) {
				throw new GoogleAuthException("Ce compte Google ne correspond pas à l’e-mail enregistré.");
			}
			return issueTokens(user, rememberMe);
		}

		if (request.termsAccepted() == null || !request.termsAccepted()) {
			throw new IllegalArgumentException("Vous devez accepter les conditions d’utilisation.");
		}
		Role desired = parseObjective(request.objective());
		Instant now = Instant.now();
		AuthUser user = AuthUser.builder()
				.email(profile.email())
				// NOTE: en seed / DB existante, password_hash peut être NOT NULL.
				// On stocke un hash aléatoire et on empêche la connexion locale si provider=GOOGLE.
				.passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
				.firstName(profile.firstName())
				.lastName(profile.lastName())
				.role(desired)
				.active(true)
				.authProvider(AuthProvider.GOOGLE)
				.googleSub(profile.sub())
				.emailVerified(true)
				.termsAcceptedAt(now)
				.createdAt(now)
				.build();
		authUserRepository.save(user);
		return issueTokens(user, rememberMe);
	}

	@Transactional
	public MessageResponse verifyEmail(String token) {
		var claims = jwtService.parseEmailVerificationToken(token);
		UUID userId = UUID.fromString(claims.getSubject());
		String email = (claims.get("email", String.class) != null) ? claims.get("email", String.class) : "";
		AuthUser user = authUserRepository.findById(userId)
				.orElseThrow(() -> new InvalidTokenException("Lien de vérification invalide."));
		if (!normalizeEmail(user.getEmail()).equals(normalizeEmail(email))) {
			throw new InvalidTokenException("Lien de vérification invalide.");
		}
		user.setEmailVerified(true);
		user.setEmailVerificationToken(null);
		user.setEmailVerificationExpiresAt(null);
		authUserRepository.save(user);
		return new MessageResponse("Votre adresse e-mail est confirmée. Vous pouvez vous connecter.");
	}

	@Transactional
	public MessageResponse resendVerification(ResendVerificationRequest request) {
		String email = normalizeEmail(request.email());
		authUserRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
			if (user.isEmailVerified()) {
				return;
			}
			if (user.getAuthProvider() == AuthProvider.GOOGLE) {
				return;
			}
			user.setEmailVerificationToken(null);
			user.setEmailVerificationExpiresAt(null);
			authUserRepository.save(user);
			sendVerificationEmail(user);
		});
		return new MessageResponse(
				"Si un compte existe avec cette adresse et n’est pas encore vérifié, un e-mail a été envoyé.");
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
		ensureEmailVerifiedForLocal(user);
		rt.setRevoked(true);
		refreshTokenRepository.save(rt);
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
		if (user.getAuthProvider() == AuthProvider.GOOGLE) {
			throw new InvalidCredentialsException("Ce compte utilise la connexion Google.");
		}
		if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
			throw new InvalidCredentialsException("Mot de passe actuel incorrect.");
		}
		user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
		authUserRepository.save(user);
		refreshTokenRepository.revokeAllForUser(userId);
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
		return AuthResponse.withTokens(toUserResponse(user), access, refreshRaw, expiresIn);
	}

	private void sendVerificationEmail(AuthUser user) {
		String base = appProperties.getFrontend().getBaseUrl();
		if (base.endsWith("/")) {
			base = base.substring(0, base.length() - 1);
		}
		String token = jwtService.createEmailVerificationToken(user.getId(), user.getEmail(), VERIFICATION_TOKEN_SECONDS);
		String url = base + "/auth/verify-email?token=" + token;
		authNotificationClient.sendEmailVerification(user.getEmail(), user.getFirstName(), url);
	}

	private void ensureEmailVerifiedForLocal(AuthUser user) {
		if (user.getAuthProvider() == AuthProvider.LOCAL && !user.isEmailVerified()) {
			throw new EmailNotVerifiedException(
					"Confirmez votre adresse e-mail avant de vous connecter. Consultez votre boîte de réception.");
		}
	}

	private static void ensureActive(AuthUser user) {
		if (!user.isActive()) {
			throw new InvalidCredentialsException("Compte désactivé.");
		}
	}

	private UserResponse toUserResponse(AuthUser user) {
		return new UserResponse(
				user.getId(),
				user.getEmail(),
				user.getFirstName(),
				user.getLastName(),
				user.getRole(),
				user.isActive(),
				user.isEmailVerified(),
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
			// token déjà invalide
		}
	}

	private static String normalizeEmail(String email) {
		return email.trim().toLowerCase();
	}

	private static Role parseObjective(String objective) {
		if (objective == null || objective.isBlank()) {
			return Role.USER;
		}
		String o = objective.trim().toUpperCase();
		if ("AUTHOR".equals(o)) {
			return Role.AUTHOR;
		}
		return Role.USER;
	}
}
