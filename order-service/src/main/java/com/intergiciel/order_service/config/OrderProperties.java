package com.intergiciel.order_service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "order")
public class OrderProperties {

	private Catalog catalog = new Catalog();
	private Notification notification = new Notification();
	private Frontend frontend = new Frontend();

	public Catalog getCatalog() {
		return catalog;
	}

	public void setCatalog(Catalog catalog) {
		this.catalog = catalog;
	}

	public Notification getNotification() {
		return notification;
	}

	public void setNotification(Notification notification) {
		this.notification = notification;
	}

	public Frontend getFrontend() {
		return frontend;
	}

	public void setFrontend(Frontend frontend) {
		this.frontend = frontend;
	}

	public static class Catalog {

		private String baseUrl = "http://localhost:8083";

		public String getBaseUrl() {
			return baseUrl;
		}

		public void setBaseUrl(String baseUrl) {
			this.baseUrl = baseUrl;
		}
	}

	public static class Notification {

		private String baseUrl = "http://localhost:8088";
		private String internalKey = "";

		public String getBaseUrl() {
			return baseUrl;
		}

		public void setBaseUrl(String baseUrl) {
			this.baseUrl = baseUrl;
		}

		public String getInternalKey() {
			return internalKey;
		}

		public void setInternalKey(String internalKey) {
			this.internalKey = internalKey;
		}
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
}
