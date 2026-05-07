package com.intergiciel.admin_service.web.dto;

import java.util.List;

public record PendingBooksResponse(
		List<Object> content,
		String message
) {
}
