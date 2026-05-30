package com.intergiciel.order_service.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CatalogBookDetail(
		UUID id,
		String title,
		String coverUrl
) {
}
