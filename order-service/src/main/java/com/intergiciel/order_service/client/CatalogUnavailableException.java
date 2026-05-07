package com.intergiciel.order_service.client;

public class CatalogUnavailableException extends RuntimeException {

	public CatalogUnavailableException(String message, Throwable cause) {
		super(message, cause);
	}
}
