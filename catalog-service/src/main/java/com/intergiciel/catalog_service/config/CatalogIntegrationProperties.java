package com.intergiciel.catalog_service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "bookvault.integration")
public record CatalogIntegrationProperties(
		String notificationServiceUrl,
		String userServiceUrl,
		String internalServiceKey
) {
}
