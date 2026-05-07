package com.intergiciel.reading_service.service;

import com.intergiciel.reading_service.domain.ReadingAnnotation;
import com.intergiciel.reading_service.repository.ReadingAnnotationRepository;
import com.intergiciel.reading_service.web.dto.AnnotationResponse;
import com.intergiciel.reading_service.web.dto.CreateAnnotationRequest;
import com.intergiciel.reading_service.web.dto.UpdateAnnotationRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ReadingAnnotationService {

	private final ReadingAnnotationRepository annotationRepository;
	private final EntitlementService entitlementService;

	public ReadingAnnotationService(ReadingAnnotationRepository annotationRepository,
			EntitlementService entitlementService) {
		this.annotationRepository = annotationRepository;
		this.entitlementService = entitlementService;
	}

	@Transactional(readOnly = true)
	public List<AnnotationResponse> list(UUID userId, UUID bookId) {
		entitlementService.requireBookAccess(userId, bookId);
		return annotationRepository.findByUserIdAndBookIdOrderByCreatedAtAsc(userId, bookId).stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional
	public AnnotationResponse create(UUID userId, CreateAnnotationRequest request) {
		entitlementService.requireBookAccess(userId, request.bookId());
		Instant now = Instant.now();
		ReadingAnnotation entity = ReadingAnnotation.builder()
				.userId(userId)
				.bookId(request.bookId())
				.anchorJson(request.anchorJson())
				.body(request.body())
				.createdAt(now)
				.updatedAt(now)
				.build();
		return toResponse(annotationRepository.save(entity));
	}

	@Transactional
	public AnnotationResponse update(UUID userId, UUID annotationId, UpdateAnnotationRequest request) {
		ReadingAnnotation entity = annotationRepository.findByIdAndUserId(annotationId, userId)
				.orElseThrow(() -> new NotFoundException("Annotation introuvable."));
		entitlementService.requireBookAccess(userId, entity.getBookId());
		entity.setAnchorJson(request.anchorJson());
		entity.setBody(request.body());
		entity.setUpdatedAt(Instant.now());
		return toResponse(annotationRepository.save(entity));
	}

	@Transactional
	public void delete(UUID userId, UUID annotationId) {
		ReadingAnnotation entity = annotationRepository.findByIdAndUserId(annotationId, userId)
				.orElseThrow(() -> new NotFoundException("Annotation introuvable."));
		entitlementService.requireBookAccess(userId, entity.getBookId());
		annotationRepository.delete(entity);
	}

	private AnnotationResponse toResponse(ReadingAnnotation a) {
		return new AnnotationResponse(
				a.getId(),
				a.getBookId(),
				a.getAnchorJson(),
				a.getBody(),
				a.getCreatedAt(),
				a.getUpdatedAt());
	}
}
