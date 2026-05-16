package com.intergiciel.catalog_service.integration;

import com.intergiciel.catalog_service.config.CatalogIntegrationProperties;
import com.intergiciel.catalog_service.domain.Book;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;
import java.util.UUID;

@Component
public class BookPublicationNotifier {

	private static final Logger log = LoggerFactory.getLogger(BookPublicationNotifier.class);

	private final RestClient notificationRestClient;
	private final RestClient userRestClient;
	private final CatalogIntegrationProperties props;

	public BookPublicationNotifier(
			@Qualifier("notificationRestClient") RestClient notificationRestClient,
			@Qualifier("userRestClient") RestClient userRestClient,
			CatalogIntegrationProperties props) {
		this.notificationRestClient = notificationRestClient;
		this.userRestClient = userRestClient;
		this.props = props;
	}

	public void notifyAdminPendingValidation(Book book, Jwt authorJwt) {
		if (book == null || authorJwt == null) {
			return;
		}
		try {
			String bearer = "Bearer " + authorJwt.getTokenValue();
			UserEmailDto author = userRestClient.get()
					.uri("/api/v1/users/{id}", book.getAuthorUserId())
					.header("Authorization", bearer)
					.retrieve()
					.body(UserEmailDto.class);
			if (author == null || author.email() == null || author.email().isBlank()) {
				log.warn("Notification file validation ignorée : e-mail auteur introuvable pour {}", book.getId());
				return;
			}
			String displayName = (author.firstName() != null ? author.firstName() : "")
					+ (author.lastName() != null ? " " + author.lastName() : "");
			Map<String, Object> body = new java.util.HashMap<>();
			body.put("bookId", book.getId());
			body.put("bookTitle", book.getTitle());
			body.put("authorUserId", book.getAuthorUserId());
			body.put("authorEmail", author.email());
			body.put("authorDisplayName", displayName.trim());
			notificationRestClient.post()
					.uri("/api/v1/notifications/internal/book-pending-validation")
					.header("X-BookVault-Internal-Key", props.internalServiceKey())
					.contentType(MediaType.APPLICATION_JSON)
					.body(body)
					.retrieve()
					.toBodilessEntity();
			log.info("Notification file validation envoyée pour le livre {}", book.getId());
		}
		catch (RestClientException ex) {
			log.warn("Notification file validation non envoyée pour {} : {}", book.getId(), ex.getMessage());
		}
	}

	public void notifyAuthorAfterAdminPublish(Book book, Jwt adminJwt) {
		if (book == null || adminJwt == null) {
			return;
		}
		try {
			String bearer = "Bearer " + adminJwt.getTokenValue();
			UserEmailDto author = userRestClient.get()
					.uri("/api/v1/users/{id}", book.getAuthorUserId())
					.header("Authorization", bearer)
					.retrieve()
					.body(UserEmailDto.class);
			if (author == null || author.email() == null || author.email().isBlank()) {
				log.warn("Notification publication ignorée : e-mail auteur introuvable pour {}", book.getId());
				return;
			}
			Map<String, Object> body = Map.of(
					"authorUserId", book.getAuthorUserId(),
					"bookId", book.getId(),
					"bookTitle", book.getTitle(),
					"recipientEmail", author.email());
			notificationRestClient.post()
					.uri("/api/v1/notifications/internal/book-published")
					.header("X-BookVault-Internal-Key", props.internalServiceKey())
					.contentType(MediaType.APPLICATION_JSON)
					.body(body)
					.retrieve()
					.toBodilessEntity();
			log.info("Notification publication envoyée pour le livre {}", book.getId());
		}
		catch (RestClientException ex) {
			log.warn("Notification publication non envoyée pour {} : {}", book.getId(), ex.getMessage());
		}
	}

	public record UserEmailDto(UUID id, String email, String firstName, String lastName) {
	}
}
