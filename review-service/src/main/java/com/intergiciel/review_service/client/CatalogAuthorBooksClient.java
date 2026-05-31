package com.intergiciel.review_service.client;

import com.intergiciel.review_service.config.ReviewProperties;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class CatalogAuthorBooksClient {

	private final ReviewProperties reviewProperties;
	private final RestClient catalogRestClient;

	public CatalogAuthorBooksClient(
			ReviewProperties reviewProperties,
			@Qualifier("catalogRestClient") RestClient catalogRestClient) {
		this.reviewProperties = reviewProperties;
		this.catalogRestClient = catalogRestClient;
	}

	public List<AuthorBookRef> listMyBooks(String bearerToken) {
		if (reviewProperties.getCatalog().isStub()) {
			return List.of();
		}
		try {
			JsonNode root = catalogRestClient.get()
					.uri(uriBuilder -> uriBuilder
							.path("/api/v1/books/mine")
							.queryParam("page", 0)
							.queryParam("size", 200)
							.build())
					.header(HttpHeaders.AUTHORIZATION, bearerToken)
					.retrieve()
					.body(JsonNode.class);
			if (root == null || !root.has("content")) {
				return List.of();
			}
			List<AuthorBookRef> out = new ArrayList<>();
			for (JsonNode node : root.get("content")) {
				UUID id = UUID.fromString(node.get("id").asText());
				String title = node.path("title").asText("");
				String cover = node.path("coverUrl").asText(null);
				int reviewCount = node.path("reviewCount").asInt(0);
				out.add(new AuthorBookRef(id, title, cover, reviewCount));
			}
			return out;
		}
		catch (RestClientException ex) {
			return List.of();
		}
	}
}
