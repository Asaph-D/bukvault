package com.intergiciel.order_service.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(OrderProperties.class)
public class RestClientConfig {

	@Bean
	@Qualifier("catalogRestClient")
	RestClient catalogRestClient(OrderProperties orderProperties) {
		return RestClient.builder()
				.baseUrl(orderProperties.getCatalog().getBaseUrl())
				.build();
	}
}
