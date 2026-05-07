package com.intergiciel.file_service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "file")
public class FileProperties {

	private Storage storage = new Storage();

	private Order order = new Order();

	private Entitlement entitlement = new Entitlement();

	public Storage getStorage() {
		return storage;
	}

	public void setStorage(Storage storage) {
		this.storage = storage;
	}

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

	public static class Storage {

		private String root = System.getProperty("user.home") + "/bookvault-files";

		public String getRoot() {
			return root;
		}

		public void setRoot(String root) {
			this.root = root;
		}
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

		private boolean stub = false;

		private boolean failOpen = false;

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
