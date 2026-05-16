package com.intergiciel.notification_service.service;

import com.intergiciel.notification_service.domain.NotificationEntity;
import com.intergiciel.notification_service.domain.NotificationKind;
import com.intergiciel.notification_service.domain.NotificationPreferencesEntity;
import com.intergiciel.notification_service.repository.NotificationPreferencesRepository;
import com.intergiciel.notification_service.repository.NotificationRepository;
import com.intergiciel.notification_service.web.dto.BookPendingValidationRequest;
import com.intergiciel.notification_service.web.dto.BookPublishedNotificationRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class NotificationDispatchService {

	private final NotificationRepository notificationRepository;
	private final NotificationPreferencesRepository preferencesRepository;
	private final EmailService emailService;
	private final String frontendBaseUrl;
	private final UUID primaryAdminUserId;
	private final String primaryAdminEmail;

	public NotificationDispatchService(
			NotificationRepository notificationRepository,
			NotificationPreferencesRepository preferencesRepository,
			EmailService emailService,
			@Value("${bookvault.frontend.base-url}") String frontendBaseUrl,
			@Value("${bookvault.admin.primary-user-id}") UUID primaryAdminUserId,
			@Value("${bookvault.admin.primary-email}") String primaryAdminEmail) {
		this.notificationRepository = notificationRepository;
		this.preferencesRepository = preferencesRepository;
		this.emailService = emailService;
		this.frontendBaseUrl = trimTrailingSlash(frontendBaseUrl);
		this.primaryAdminUserId = primaryAdminUserId;
		this.primaryAdminEmail = primaryAdminEmail;
	}

	@Transactional
	public void notifyBookPendingValidation(BookPendingValidationRequest req) {
		String sheetUrl = publicationSheetUrl(req.bookId(), true);
		String validationsUrl = frontendBaseUrl + "/dashboard/admin/validations";
		String authorLabel = req.authorDisplayName() != null && !req.authorDisplayName().isBlank()
				? req.authorDisplayName()
				: req.authorEmail();

		notificationRepository.save(new NotificationEntity(
				primaryAdminUserId,
				NotificationKind.SYSTEM,
				"Nouveau manuscrit à valider",
				"« " + req.bookTitle() + " » par " + authorLabel + " — consultez la file de validations.",
				validationsUrl,
				false));

		emailService.sendBookPendingValidation(
				primaryAdminEmail, req.bookTitle(), authorLabel, sheetUrl, validationsUrl);
	}

	@Transactional
	public void notifyBookPublishedByAdmin(BookPublishedNotificationRequest req) {
		String sheetUrl = publicationSheetUrl(req.bookId(), false);
		String title = "Livre publié";
		String message = "« " + req.bookTitle() + " » a été validé et est maintenant visible sur BookVault.";

		NotificationEntity entity = new NotificationEntity(
				req.authorUserId(),
				NotificationKind.BOOK,
				title,
				message,
				sheetUrl,
				false);
		notificationRepository.save(entity);

		NotificationPreferencesEntity prefs = preferencesRepository.findById(req.authorUserId())
				.orElseGet(() -> new NotificationPreferencesEntity(req.authorUserId()));
		if (prefs.isEmailEnabled()) {
			emailService.sendBookPublished(req.recipientEmail(), req.bookTitle(), sheetUrl);
		}
	}

	private String publicationSheetUrl(UUID bookId, boolean pending) {
		String base = frontendBaseUrl + "/publication/" + bookId;
		return pending ? base + "?view=pending" : base;
	}

	private static String trimTrailingSlash(String url) {
		if (url == null || url.isBlank()) {
			return "http://localhost:4200";
		}
		return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
	}
}
