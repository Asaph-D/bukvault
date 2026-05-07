package com.intergiciel.api_gateway.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS appliqué sur la gateway pour le front Angular (dev) et clients externes.
 */
@Configuration
public class GatewayCorsConfig implements WebMvcConfigurer {

	@Override
	public void addCorsMappings(@NonNull CorsRegistry registry) {
		registry.addMapping("/**")
				.allowedOriginPatterns(
						"http://localhost:*",
						"http://192.168.1.215:*",
						"http://127.0.0.1:*")
				.allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD")
				.allowedHeaders("*")
				.exposedHeaders("Authorization", "Content-Disposition", "X-Request-Id")
				.maxAge(3600);
	}
}
