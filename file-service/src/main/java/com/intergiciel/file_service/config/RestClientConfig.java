package com.intergiciel.file_service.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(FileProperties.class)
public class RestClientConfig {

	@Bean
	@Qualifier("orderRestClient")
	RestClient orderRestClient(FileProperties fileProperties) {
		return RestClient.builder()
				.baseUrl(fileProperties.getOrder().getBaseUrl())
				.build();
	}
}
