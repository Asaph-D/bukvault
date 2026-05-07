package com.intergiciel.author_service.client;

import tools.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

import java.util.UUID;

@Component
public class CatalogBrowseClient {

	private final RestClient catalogRestClient;
	private final JsonMapper jsonMapper;

	public CatalogBrowseClient(
			@Qualifier("catalogRestClient") RestClient catalogRestClient,
			JsonMapper jsonMapper) {
		this.catalogRestClient = catalogRestClient;
		this.jsonMapper = jsonMapper;
	}

	public JsonNode fetchBooksByAuthor(UUID authorId, int page, int size) {
		try {
			String json = catalogRestClient.get()
					.uri(uriBuilder -> uriBuilder
							.path("/api/v1/books")
							.queryParam("authorId", authorId)
							.queryParam("page", page)
							.queryParam("size", size)
							.build())
					.retrieve()
					.body(String.class);
			return jsonMapper.readTree(json);
		}
		catch (RestClientException ex) {
			throw new CatalogUnavailableException("Catalogue indisponible.", ex);
		}
		catch (JacksonException ex) {
			throw new CatalogUnavailableException("Réponse catalogue invalide.", ex);
		}
	}
}
