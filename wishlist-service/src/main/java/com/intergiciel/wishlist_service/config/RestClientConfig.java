package com.intergiciel.wishlist_service.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(WishlistProperties.class)
public class RestClientConfig {

	@Bean
	@Qualifier("orderRestClient")
	RestClient orderRestClient(WishlistProperties wishlistProperties) {
		return RestClient.builder()
				.baseUrl(wishlistProperties.getOrder().getBaseUrl())
				.build();
	}
}
