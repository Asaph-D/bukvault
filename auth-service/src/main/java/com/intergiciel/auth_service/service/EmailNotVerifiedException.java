package com.intergiciel.auth_service.service;

public class EmailNotVerifiedException extends RuntimeException {

	public EmailNotVerifiedException(String message) {
		super(message);
	}
}
