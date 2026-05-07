package com.intergiciel.file_service.web.dto;

import java.util.UUID;

public record FileUploadResponse(Long id, UUID bookId, String mimeType, long sizeBytes) {
}
