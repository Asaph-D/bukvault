package com.intergiciel.reading_service.service;

import com.intergiciel.reading_service.client.EntitlementResponse;
import com.intergiciel.reading_service.config.ReadingProperties;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.UUID;

@Service
public class EntitlementService {

	private final ReadingProperties readingProperties;
	private final RestClient orderRestClient;

	public EntitlementService(ReadingProperties readingProperties,
			@Qualifier("orderRestClient") RestClient orderRestClient) {
		this.readingProperties = readingProperties;
		this.orderRestClient = orderRestClient;
	}

	public void requireBookAccess(UUID userId, UUID bookId) {
		if (!hasBookAccess(userId, bookId)) {
			throw new ForbiddenBookAccessException(
					"Aucun droit de lecture pour ce livre (achat ou abonnement requis).");
		}
	}

	public boolean hasBookAccess(UUID userId, UUID bookId) {
		if (readingProperties.isEntitlementStub()) {
			return true;
		}
		try {
			EntitlementResponse body = orderRestClient.get()
					.uri("/api/v1/internal/entitlements/users/{userId}/books/{bookId}", userId, bookId)
					.retrieve()
					.body(EntitlementResponse.class);
			return body != null && body.allowed();
		}
		catch (RestClientException ex) {
			return readingProperties.isEntitlementFailOpen();
		}
	}
}
