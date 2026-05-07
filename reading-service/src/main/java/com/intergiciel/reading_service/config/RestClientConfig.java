package com.intergiciel.reading_service.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

	@Bean
	@Qualifier("orderRestClient")
	RestClient orderRestClient(ReadingProperties readingProperties) {
		return RestClient.builder()
				.baseUrl(readingProperties.getOrderServiceBaseUrl())
				.build();
	}
}
