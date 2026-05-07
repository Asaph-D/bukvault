package com.intergiciel.admin_service.service;

import com.intergiciel.admin_service.web.dto.AdminDashboardResponse;
import com.intergiciel.admin_service.web.dto.PendingBooksResponse;
import com.intergiciel.admin_service.web.dto.PublishBookPayload;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Collections;
import java.util.UUID;

@Service
public class AdminFacadeService {

	private final RestClient catalogRestClient;

	public AdminFacadeService(@Qualifier("catalogRestClient") RestClient catalogRestClient) {
		this.catalogRestClient = catalogRestClient;
	}

	public AdminDashboardResponse dashboard() {
		return new AdminDashboardResponse(0, 0, 0,
				"Compteurs stub — brancher agrégations catalog / review / user.");
	}

	public PendingBooksResponse pendingBooks() {
		return new PendingBooksResponse(Collections.emptyList(),
				"Liste des brouillons : ajouter un filtre côté catalog-service ou requête admin dédiée.");
	}

	public ResponseEntity<String> publishBook(UUID bookId, String authorizationHeader, boolean publish) {
		try {
			String body = catalogRestClient.patch()
					.uri("/api/v1/books/{id}/publish", bookId)
					.header(HttpHeaders.AUTHORIZATION, authorizationHeader)
					.contentType(MediaType.APPLICATION_JSON)
					.body(new PublishBookPayload(publish))
					.retrieve()
					.body(String.class);
			return ResponseEntity.ok(body);
		}
		catch (RestClientException ex) {
			throw ex;
		}
	}
}
