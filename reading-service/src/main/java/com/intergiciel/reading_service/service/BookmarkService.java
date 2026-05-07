package com.intergiciel.reading_service.service;

import com.intergiciel.reading_service.domain.Bookmark;
import com.intergiciel.reading_service.repository.BookmarkRepository;
import com.intergiciel.reading_service.web.dto.BookmarkResponse;
import com.intergiciel.reading_service.web.dto.CreateBookmarkRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class BookmarkService {

	private final BookmarkRepository bookmarkRepository;
	private final EntitlementService entitlementService;

	public BookmarkService(BookmarkRepository bookmarkRepository, EntitlementService entitlementService) {
		this.bookmarkRepository = bookmarkRepository;
		this.entitlementService = entitlementService;
	}

	@Transactional(readOnly = true)
	public List<BookmarkResponse> list(UUID userId, UUID bookId) {
		entitlementService.requireBookAccess(userId, bookId);
		return bookmarkRepository.findByUserIdAndBookIdOrderByCreatedAtDesc(userId, bookId).stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional
	public BookmarkResponse create(UUID userId, CreateBookmarkRequest request) {
		entitlementService.requireBookAccess(userId, request.bookId());
		Bookmark entity = Bookmark.builder()
				.userId(userId)
				.bookId(request.bookId())
				.anchorJson(request.anchorJson())
				.label(request.label())
				.createdAt(Instant.now())
				.build();
		return toResponse(bookmarkRepository.save(entity));
	}

	@Transactional
	public void delete(UUID userId, UUID bookmarkId) {
		var bookmark = bookmarkRepository.findByIdAndUserId(bookmarkId, userId)
				.orElseThrow(() -> new NotFoundException("Signet introuvable."));
		entitlementService.requireBookAccess(userId, bookmark.getBookId());
		bookmarkRepository.delete(bookmark);
	}

	private BookmarkResponse toResponse(Bookmark b) {
		return new BookmarkResponse(b.getId(), b.getBookId(), b.getAnchorJson(), b.getLabel(), b.getCreatedAt());
	}
}
