package com.intergiciel.review_service.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(ReviewProperties.class)
public class RestClientConfig {

	@Bean
	@Qualifier("orderRestClient")
	RestClient orderRestClient(ReviewProperties reviewProperties) {
		return RestClient.builder()
				.baseUrl(reviewProperties.getOrder().getBaseUrl())
				.build();
	}
}
