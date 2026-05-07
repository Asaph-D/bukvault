package com.intergiciel.reading_service.service;

import com.intergiciel.reading_service.domain.ReadingMediaType;
import com.intergiciel.reading_service.domain.ReadingProgress;
import com.intergiciel.reading_service.domain.ReadingProgressId;
import com.intergiciel.reading_service.repository.ReadingProgressRepository;
import com.intergiciel.reading_service.web.dto.ProgressResponse;
import com.intergiciel.reading_service.web.dto.UpdateProgressRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ReadingProgressService {

	private final ReadingProgressRepository readingProgressRepository;
	private final EntitlementService entitlementService;

	public ReadingProgressService(ReadingProgressRepository readingProgressRepository,
			EntitlementService entitlementService) {
		this.readingProgressRepository = readingProgressRepository;
		this.entitlementService = entitlementService;
	}

	@Transactional(readOnly = true)
	public List<ProgressResponse> listForUser(UUID userId) {
		return readingProgressRepository.findByIdUserIdOrderByIdBookIdAsc(userId).stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional(readOnly = true)
	public Optional<ProgressResponse> get(UUID userId, UUID bookId, ReadingMediaType mediaType) {
		entitlementService.requireBookAccess(userId, bookId);
		ReadingProgressId id = new ReadingProgressId(userId, bookId, mediaType);
		return readingProgressRepository.findById(id).map(this::toResponse);
	}

	@Transactional
	public ProgressResponse upsert(UUID userId, UUID bookId, UpdateProgressRequest request) {
		entitlementService.requireBookAccess(userId, bookId);
		ReadingProgressId id = new ReadingProgressId(userId, bookId, request.mediaType());
		Instant now = Instant.now();
		ReadingProgress entity = readingProgressRepository.findById(id)
				.map(existing -> {
					existing.setPositionJson(request.positionJson());
					existing.setDeviceId(request.deviceId());
					existing.setClientUpdatedAt(request.clientUpdatedAt());
					existing.setServerUpdatedAt(now);
					return existing;
				})
				.orElseGet(() -> ReadingProgress.builder()
						.id(id)
						.positionJson(request.positionJson())
						.deviceId(request.deviceId())
						.serverUpdatedAt(now)
						.clientUpdatedAt(request.clientUpdatedAt())
						.build());
		return toResponse(readingProgressRepository.save(entity));
	}

	private ProgressResponse toResponse(ReadingProgress p) {
		return new ProgressResponse(
				p.getId().getBookId(),
				p.getId().getMediaType(),
				p.getPositionJson(),
				p.getDeviceId(),
				p.getServerUpdatedAt(),
				p.getClientUpdatedAt());
	}
}
