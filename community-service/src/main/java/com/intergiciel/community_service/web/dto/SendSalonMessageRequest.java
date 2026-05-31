package com.intergiciel.community_service.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendSalonMessageRequest(
		@NotBlank @Size(max = 2000) String content) {
}
