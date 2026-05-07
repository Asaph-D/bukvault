package com.intergiciel.author_service.web.dto;

import jakarta.validation.constraints.Size;

public record AuthorProfileUpdateRequest(
		@Size(max = 200) String penName,
		@Size(max = 500) String website,
		@Size(max = 4000) String bio
) {
}
