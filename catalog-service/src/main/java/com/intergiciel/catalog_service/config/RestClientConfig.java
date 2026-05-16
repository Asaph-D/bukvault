package com.intergiciel.catalog_service.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

	@Bean
	@Qualifier("notificationRestClient")
	RestClient notificationRestClient(CatalogIntegrationProperties props) {
		return RestClient.builder()
				.baseUrl(props.notificationServiceUrl())
				.build();
	}

	@Bean
	@Qualifier("userRestClient")
	RestClient userRestClient(CatalogIntegrationProperties props) {
		return RestClient.builder()
				.baseUrl(props.userServiceUrl())
				.build();
	}
}
