package com.intergiciel.reading_service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "reading")
public class ReadingProperties {

	/**
	 * Base URL of order-service (entitlement checks).
	 */
	private String orderServiceBaseUrl = "http://localhost:8084";

	/**
	 * If true, skip HTTP call to order-service and allow access (local dev).
	 */
	private boolean entitlementStub = true;

	/**
	 * If order-service is unreachable, allow access when true; deny when false.
	 */
	private boolean entitlementFailOpen = true;

	public String getOrderServiceBaseUrl() {
		return orderServiceBaseUrl;
	}

	public void setOrderServiceBaseUrl(String orderServiceBaseUrl) {
		this.orderServiceBaseUrl = orderServiceBaseUrl;
	}

	public boolean isEntitlementStub() {
		return entitlementStub;
	}

	public void setEntitlementStub(boolean entitlementStub) {
		this.entitlementStub = entitlementStub;
	}

	public boolean isEntitlementFailOpen() {
		return entitlementFailOpen;
	}

	public void setEntitlementFailOpen(boolean entitlementFailOpen) {
		this.entitlementFailOpen = entitlementFailOpen;
	}
}
