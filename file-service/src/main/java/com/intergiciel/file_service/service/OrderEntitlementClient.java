package com.intergiciel.file_service.service;

import com.intergiciel.file_service.client.EntitlementResponse;
import com.intergiciel.file_service.config.FileProperties;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.UUID;

@Service
public class OrderEntitlementClient {

	private final FileProperties fileProperties;
	private final RestClient orderRestClient;

	public OrderEntitlementClient(FileProperties fileProperties,
			@Qualifier("orderRestClient") RestClient orderRestClient) {
		this.fileProperties = fileProperties;
		this.orderRestClient = orderRestClient;
	}

	public boolean hasBookAccess(UUID userId, UUID bookId) {
		if (fileProperties.getEntitlement().isStub()) {
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
			return fileProperties.getEntitlement().isFailOpen();
		}
	}
}
