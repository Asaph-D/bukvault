package com.intergiciel.order_service.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CatalogBookSnapshot(
		UUID id,
		BigDecimal price,
		String status
) {
}
