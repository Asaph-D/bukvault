package com.intergiciel.admin_service.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(AdminProperties.class)
public class RestClientConfig {

	@Bean
	@Qualifier("catalogRestClient")
	RestClient catalogRestClient(AdminProperties adminProperties) {
		return RestClient.builder()
				.baseUrl(adminProperties.getCatalog().getBaseUrl())
				.build();
	}
}
