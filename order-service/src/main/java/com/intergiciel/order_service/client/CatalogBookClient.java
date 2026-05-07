package com.intergiciel.order_service.client;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.UUID;

@Component
public class CatalogBookClient {

	private final RestClient catalogRestClient;

	public CatalogBookClient(@Qualifier("catalogRestClient") RestClient catalogRestClient) {
		this.catalogRestClient = catalogRestClient;
	}

	public CatalogBookSnapshot fetchBook(UUID bookId) {
		try {
			return catalogRestClient.get()
					.uri("/api/v1/books/{id}", bookId)
					.retrieve()
					.body(CatalogBookSnapshot.class);
		}
		catch (RestClientException ex) {
			throw new CatalogUnavailableException("Catalog indisponible ou livre introuvable.", ex);
		}
	}
}
