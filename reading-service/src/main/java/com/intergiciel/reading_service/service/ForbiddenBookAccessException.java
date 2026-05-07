package com.intergiciel.reading_service.service;

public class ForbiddenBookAccessException extends RuntimeException {

	public ForbiddenBookAccessException(String message) {
		super(message);
	}
}
