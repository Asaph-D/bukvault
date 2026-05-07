package com.intergiciel.reading_service.web;

import com.intergiciel.reading_service.domain.ReadingMediaType;
import com.intergiciel.reading_service.security.JwtUserIds;
import com.intergiciel.reading_service.service.BookmarkService;
import com.intergiciel.reading_service.service.ReadingAnnotationService;
import com.intergiciel.reading_service.service.ReadingProgressService;
import com.intergiciel.reading_service.web.dto.AnnotationResponse;
import com.intergiciel.reading_service.web.dto.BookmarkResponse;
import com.intergiciel.reading_service.web.dto.CreateAnnotationRequest;
import com.intergiciel.reading_service.web.dto.CreateBookmarkRequest;
import com.intergiciel.reading_service.web.dto.ProgressResponse;
import com.intergiciel.reading_service.web.dto.UpdateAnnotationRequest;
import com.intergiciel.reading_service.web.dto.UpdateProgressRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reading")
@Validated
@Tag(name = "Reading", description = "Progression, signets et annotations (e-book / audio)")
public class ReadingController {

	private final ReadingProgressService readingProgressService;
	private final BookmarkService bookmarkService;
	private final ReadingAnnotationService readingAnnotationService;

	public ReadingController(ReadingProgressService readingProgressService,
			BookmarkService bookmarkService,
			ReadingAnnotationService readingAnnotationService) {
		this.readingProgressService = readingProgressService;
		this.bookmarkService = bookmarkService;
		this.readingAnnotationService = readingAnnotationService;
	}

	@GetMapping("/progress")
	@Operation(summary = "Liste les progressions de l'utilisateur connecté")
	public List<ProgressResponse> listProgress(@AuthenticationPrincipal Jwt jwt) {
		return readingProgressService.listForUser(JwtUserIds.requireUserId(jwt));
	}

	@GetMapping("/progress/{bookId}")
	@Operation(summary = "Lit la progression pour un livre et un type de média")
	public ResponseEntity<ProgressResponse> getProgress(
			@AuthenticationPrincipal Jwt jwt,
			@PathVariable UUID bookId,
			@RequestParam ReadingMediaType mediaType) {
		return readingProgressService
				.get(JwtUserIds.requireUserId(jwt), bookId, mediaType)
				.map(ResponseEntity::ok)
				.orElseGet(() -> ResponseEntity.notFound().build());
	}

	@PutMapping("/progress/{bookId}")
	@Operation(summary = "Crée ou met à jour la progression (synchronisation multi-appareils)")
	public ProgressResponse upsertProgress(
			@AuthenticationPrincipal Jwt jwt,
			@PathVariable UUID bookId,
			@Valid @RequestBody UpdateProgressRequest request) {
		return readingProgressService.upsert(JwtUserIds.requireUserId(jwt), bookId, request);
	}

	@GetMapping("/bookmarks/{bookId}")
	public List<BookmarkResponse> listBookmarks(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID bookId) {
		return bookmarkService.list(JwtUserIds.requireUserId(jwt), bookId);
	}

	@PostMapping("/bookmarks")
	@ResponseStatus(HttpStatus.CREATED)
	public BookmarkResponse createBookmark(@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody CreateBookmarkRequest request) {
		return bookmarkService.create(JwtUserIds.requireUserId(jwt), request);
	}

	@DeleteMapping("/bookmarks/{bookmarkId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteBookmark(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID bookmarkId) {
		bookmarkService.delete(JwtUserIds.requireUserId(jwt), bookmarkId);
	}

	@GetMapping("/annotations/{bookId}")
	public List<AnnotationResponse> listAnnotations(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID bookId) {
		return readingAnnotationService.list(JwtUserIds.requireUserId(jwt), bookId);
	}

	@PostMapping("/annotations")
	@ResponseStatus(HttpStatus.CREATED)
	public AnnotationResponse createAnnotation(@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody CreateAnnotationRequest request) {
		return readingAnnotationService.create(JwtUserIds.requireUserId(jwt), request);
	}

	@PutMapping("/annotations/{annotationId}")
	public AnnotationResponse updateAnnotation(
			@AuthenticationPrincipal Jwt jwt,
			@PathVariable UUID annotationId,
			@Valid @RequestBody UpdateAnnotationRequest request) {
		return readingAnnotationService.update(JwtUserIds.requireUserId(jwt), annotationId, request);
	}

	@DeleteMapping("/annotations/{annotationId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteAnnotation(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID annotationId) {
		readingAnnotationService.delete(JwtUserIds.requireUserId(jwt), annotationId);
	}
}
