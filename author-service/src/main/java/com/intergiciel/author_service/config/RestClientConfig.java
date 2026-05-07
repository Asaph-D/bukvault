package com.intergiciel.author_service.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(AuthorProperties.class)
public class RestClientConfig {

	@Bean
	@Qualifier("catalogRestClient")
	RestClient catalogRestClient(AuthorProperties authorProperties) {
		return RestClient.builder()
				.baseUrl(authorProperties.getCatalog().getBaseUrl())
				.build();
	}
}
