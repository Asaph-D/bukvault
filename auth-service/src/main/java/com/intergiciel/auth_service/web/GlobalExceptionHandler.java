package com.intergiciel.auth_service.web;

import com.intergiciel.auth_service.service.DuplicateEmailException;
import com.intergiciel.auth_service.service.InvalidCredentialsException;
import com.intergiciel.auth_service.service.InvalidTokenException;
import com.intergiciel.auth_service.service.UserNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(DuplicateEmailException.class)
	ProblemDetail duplicateEmail(DuplicateEmailException ex) {
		ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
		pd.setType(URI.create("https://bookvault.local/errors/duplicate-email"));
		return pd;
	}

	@ExceptionHandler({ InvalidCredentialsException.class })
	ProblemDetail invalidCredentials(RuntimeException ex) {
		ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
		pd.setType(URI.create("https://bookvault.local/errors/invalid-credentials"));
		return pd;
	}

	@ExceptionHandler(InvalidTokenException.class)
	ProblemDetail invalidToken(InvalidTokenException ex) {
		ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
		pd.setType(URI.create("https://bookvault.local/errors/invalid-token"));
		return pd;
	}

	@ExceptionHandler(UserNotFoundException.class)
	ProblemDetail userNotFound(UserNotFoundException ex) {
		ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
		pd.setType(URI.create("https://bookvault.local/errors/user-not-found"));
		return pd;
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	ProblemDetail validation(MethodArgumentNotValidException ex) {
		String msg = ex.getBindingResult().getFieldErrors().stream()
				.map(FieldError::getDefaultMessage)
				.collect(Collectors.joining("; "));
		ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, msg);
		pd.setType(URI.create("https://bookvault.local/errors/validation"));
		return pd;
	}
}
