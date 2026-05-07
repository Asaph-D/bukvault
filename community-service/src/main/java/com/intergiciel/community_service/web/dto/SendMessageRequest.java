package com.intergiciel.community_service.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendMessageRequest(
		@NotBlank @Size(max = 8000) String content) {
}
