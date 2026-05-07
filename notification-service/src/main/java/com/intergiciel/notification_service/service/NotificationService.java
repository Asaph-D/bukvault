package com.intergiciel.notification_service.service;

import com.intergiciel.notification_service.domain.NotificationEntity;
import com.intergiciel.notification_service.domain.NotificationPreferencesEntity;
import com.intergiciel.notification_service.repository.NotificationPreferencesRepository;
import com.intergiciel.notification_service.repository.NotificationRepository;
import com.intergiciel.notification_service.web.dto.NotificationResponse;
import com.intergiciel.notification_service.web.dto.PreferencesResponse;
import com.intergiciel.notification_service.web.dto.PreferencesUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class NotificationService {

	private final NotificationRepository notificationRepository;
	private final NotificationPreferencesRepository preferencesRepository;

	public NotificationService(NotificationRepository notificationRepository,
			NotificationPreferencesRepository preferencesRepository) {
		this.notificationRepository = notificationRepository;
		this.preferencesRepository = preferencesRepository;
	}

	@Transactional(readOnly = true)
	public Page<NotificationResponse> list(UUID userId, Pageable pageable) {
		return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
				.map(this::toResponse);
	}

	@Transactional
	public NotificationResponse markRead(UUID userId, Long notificationId) {
		NotificationEntity n = notificationRepository.findByIdAndUserId(notificationId, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification introuvable."));
		n.setReadFlag(true);
		return toResponse(notificationRepository.save(n));
	}

	@Transactional
	public int markAllRead(UUID userId) {
		return notificationRepository.markAllReadForUser(userId);
	}

	@Transactional(readOnly = true)
	public PreferencesResponse getPreferences(UUID userId) {
		NotificationPreferencesEntity p = preferencesRepository.findById(userId)
				.orElseGet(() -> new NotificationPreferencesEntity(userId));
		return new PreferencesResponse(p.isEmailEnabled(), p.isInAppEnabled(), p.isMarketingEnabled());
	}

	@Transactional
	public PreferencesResponse updatePreferences(UUID userId, PreferencesUpdateRequest req) {
		NotificationPreferencesEntity p = preferencesRepository.findById(userId)
				.orElseGet(() -> new NotificationPreferencesEntity(userId));
		p.setEmailEnabled(req.emailEnabled());
		p.setInAppEnabled(req.inAppEnabled());
		p.setMarketingEnabled(req.marketingEnabled());
		NotificationPreferencesEntity saved = preferencesRepository.save(p);
		return new PreferencesResponse(saved.isEmailEnabled(), saved.isInAppEnabled(), saved.isMarketingEnabled());
	}

	private NotificationResponse toResponse(NotificationEntity n) {
		return new NotificationResponse(
				n.getId(),
				n.getKind(),
				n.getTitle(),
				n.getMessage(),
				n.isReadFlag(),
				n.getCreatedAt());
	}
}
