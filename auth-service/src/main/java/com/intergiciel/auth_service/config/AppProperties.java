package com.intergiciel.auth_service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "bookvault")
public class AppProperties {

	private final Frontend frontend = new Frontend();
	private final Google google = new Google();
	private final Notification notification = new Notification();

	public Frontend getFrontend() {
		return frontend;
	}

	public Google getGoogle() {
		return google;
	}

	public Notification getNotification() {
		return notification;
	}

	public static class Frontend {
		private String baseUrl = "http://localhost:4200";

		public String getBaseUrl() {
			return baseUrl;
		}

		public void setBaseUrl(String baseUrl) {
			this.baseUrl = baseUrl;
		}
	}

	public static class Google {
		private String clientId = "";

		public String getClientId() {
			return clientId;
		}

		public void setClientId(String clientId) {
			this.clientId = clientId;
		}
	}

	public static class Notification {
		private String serviceUrl = "http://localhost:8088";
		private String internalKey = "";

		public String getServiceUrl() {
			return serviceUrl;
		}

		public void setServiceUrl(String serviceUrl) {
			this.serviceUrl = serviceUrl;
		}

		public String getInternalKey() {
			return internalKey;
		}

		public void setInternalKey(String internalKey) {
			this.internalKey = internalKey;
		}
	}
}
