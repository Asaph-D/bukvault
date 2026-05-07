package com.intergiciel.user_service.web;

import com.intergiciel.user_service.service.ForbiddenAccessException;
import com.intergiciel.user_service.service.UserNotFoundException;
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

	@ExceptionHandler(UserNotFoundException.class)
	ProblemDetail notFound(UserNotFoundException ex) {
		ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
		pd.setType(URI.create("https://bookvault.local/errors/not-found"));
		return pd;
	}

	@ExceptionHandler(ForbiddenAccessException.class)
	ProblemDetail forbidden(ForbiddenAccessException ex) {
		ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
		pd.setType(URI.create("https://bookvault.local/errors/forbidden"));
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
