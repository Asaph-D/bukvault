package com.intergiciel.user_service.service;

import com.intergiciel.user_service.domain.CommunityVisibility;
import com.intergiciel.user_service.domain.ReaderHomeDefault;
import com.intergiciel.user_service.domain.ThemePreference;
import com.intergiciel.user_service.domain.UiDensity;
import com.intergiciel.user_service.domain.UserReaderSettings;
import com.intergiciel.user_service.repository.UserProfileRepository;
import com.intergiciel.user_service.repository.UserReaderSettingsRepository;
import com.intergiciel.user_service.web.dto.ReaderSettingsResponse;
import com.intergiciel.user_service.web.dto.UpdateReaderSettingsRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class ReaderSettingsService {

	private final UserReaderSettingsRepository readerSettingsRepository;
	private final UserProfileRepository userProfileRepository;

	public ReaderSettingsService(
			UserReaderSettingsRepository readerSettingsRepository,
			UserProfileRepository userProfileRepository) {
		this.readerSettingsRepository = readerSettingsRepository;
		this.userProfileRepository = userProfileRepository;
	}

	/** Lecture ; crée une ligne par défaut si absente (première connexion profil). */
	@Transactional
	public ReaderSettingsResponse get(UUID userId, Jwt jwt) {
		requireSelfOrAdmin(userId, jwt);
		userProfileRepository.findById(userId)
				.orElseThrow(() -> new UserNotFoundException("Utilisateur introuvable."));
		return readerSettingsRepository.findById(userId)
				.map(this::toResponse)
				.orElseGet(() -> toResponse(insertDefaults(userId)));
	}

	@Transactional
	public ReaderSettingsResponse upsert(UUID userId, UpdateReaderSettingsRequest req, Jwt jwt) {
		requireSelfOrAdmin(userId, jwt);
		userProfileRepository.findById(userId)
				.orElseThrow(() -> new UserNotFoundException("Utilisateur introuvable."));
		UserReaderSettings entity = readerSettingsRepository.findById(userId)
				.orElseGet(() -> UserReaderSettings.builder().userId(userId).build());
		entity.setTheme(req.theme());
		entity.setUiDensity(req.uiDensity());
		entity.setLocaleOverride(normalizeLocale(req.localeOverride()));
		entity.setNotifyOrders(req.notifyOrders());
		entity.setNotifyPromotions(req.notifyPromotions());
		entity.setNotifySocial(req.notifySocial());
		entity.setCommunityVisibility(req.communityVisibility());
		entity.setAllowDirectMessages(req.allowDirectMessages());
		entity.setReaderHomeDefault(req.readerHomeDefault());
		entity.setLibraryShowProgress(req.libraryShowProgress());
		entity.setReduceMotion(req.reduceMotion());
		entity.setUpdatedAt(Instant.now());
		return toResponse(readerSettingsRepository.save(entity));
	}

	/** Appelé après création du profil (bootstrap). */
	@Transactional
	public void ensureDefaults(UUID userId) {
		if (readerSettingsRepository.existsById(userId)) {
			return;
		}
		insertDefaults(userId);
	}

	private UserReaderSettings insertDefaults(UUID userId) {
		Instant now = Instant.now();
		UserReaderSettings s = UserReaderSettings.builder()
				.userId(userId)
				.theme(ThemePreference.SYSTEM)
				.uiDensity(UiDensity.COMFORTABLE)
				.localeOverride(null)
				.notifyOrders(true)
				.notifyPromotions(false)
				.notifySocial(true)
				.communityVisibility(CommunityVisibility.PUBLIC)
				.allowDirectMessages(true)
				.readerHomeDefault(ReaderHomeDefault.OVERVIEW)
				.libraryShowProgress(true)
				.reduceMotion(false)
				.updatedAt(now)
				.build();
		return readerSettingsRepository.save(s);
	}

	private static String normalizeLocale(String locale) {
		if (locale == null || locale.isBlank()) {
			return null;
		}
		return locale.trim().toLowerCase();
	}

	private ReaderSettingsResponse toResponse(UserReaderSettings s) {
		return new ReaderSettingsResponse(
				s.getTheme(),
				s.getUiDensity(),
				s.getLocaleOverride(),
				s.isNotifyOrders(),
				s.isNotifyPromotions(),
				s.isNotifySocial(),
				s.getCommunityVisibility(),
				s.isAllowDirectMessages(),
				s.getReaderHomeDefault(),
				s.isLibraryShowProgress(),
				s.isReduceMotion(),
				s.getUpdatedAt());
	}

	private void requireSelfOrAdmin(UUID targetUserId, Jwt jwt) {
		UUID caller = UUID.fromString(jwt.getSubject());
		String role = jwt.getClaimAsString("role");
		boolean admin = "ADMIN".equals(role);
		if (!admin && !caller.equals(targetUserId)) {
			throw new ForbiddenAccessException("Accès réservé au propriétaire ou à un administrateur.");
		}
	}
}
