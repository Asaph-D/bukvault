package com.intergiciel.community_service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "community")
public class CommunityProperties {

	/** URL publique API (gateway) pour construire les liens avatar. */
	private String apiPublicBaseUrl = "http://localhost:8080";

	public String getApiPublicBaseUrl() {
		return apiPublicBaseUrl;
	}

	public void setApiPublicBaseUrl(String apiPublicBaseUrl) {
		this.apiPublicBaseUrl = apiPublicBaseUrl;
	}
}
