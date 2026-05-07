package com.intergiciel.review_service.service;

import com.intergiciel.review_service.client.EntitlementResponse;
import com.intergiciel.review_service.config.ReviewProperties;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.UUID;

@Component
public class OrderEntitlementClient {

	private final ReviewProperties reviewProperties;
	private final RestClient orderRestClient;

	public OrderEntitlementClient(ReviewProperties reviewProperties,
			@Qualifier("orderRestClient") RestClient orderRestClient) {
		this.reviewProperties = reviewProperties;
		this.orderRestClient = orderRestClient;
	}

	public boolean hasPurchasedBook(UUID userId, UUID bookId) {
		if (reviewProperties.getEntitlement().isStub()) {
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
			return reviewProperties.getEntitlement().isFailOpen();
		}
	}
}
