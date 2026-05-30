package com.intergiciel.author_service.client;

public class OrderUnavailableException extends RuntimeException {

	public OrderUnavailableException(String message, Throwable cause) {
		super(message, cause);
	}
}
