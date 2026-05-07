package com.intergiciel.review_service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "review")
public class ReviewProperties {

	private Order order = new Order();
	private Entitlement entitlement = new Entitlement();

	public Order getOrder() {
		return order;
	}

	public void setOrder(Order order) {
		this.order = order;
	}

	public Entitlement getEntitlement() {
		return entitlement;
	}

	public void setEntitlement(Entitlement entitlement) {
		this.entitlement = entitlement;
	}

	public static class Order {
		private String baseUrl = "http://localhost:8084";

		public String getBaseUrl() {
			return baseUrl;
		}

		public void setBaseUrl(String baseUrl) {
			this.baseUrl = baseUrl;
		}
	}

	public static class Entitlement {
		private boolean stub = true;
		private boolean failOpen = true;

		public boolean isStub() {
			return stub;
		}

		public void setStub(boolean stub) {
			this.stub = stub;
		}

		public boolean isFailOpen() {
			return failOpen;
		}

		public void setFailOpen(boolean failOpen) {
			this.failOpen = failOpen;
		}
	}
}
