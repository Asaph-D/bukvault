package com.intergiciel.file_service.web;

import com.intergiciel.file_service.service.StoredFileService;
import com.intergiciel.file_service.web.dto.FileUploadResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/files")
@Tag(name = "Fichiers")
public class FileController {

	private final StoredFileService storedFileService;

	public FileController(StoredFileService storedFileService) {
		this.storedFileService = storedFileService;
	}

	@PostMapping(value = "/upload/ebook", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("hasRole('AUTHOR')")
	@Operation(summary = "Uploader un e-book (remplace la version précédente)")
	public FileUploadResponse uploadEbook(
			Authentication authentication,
			@RequestParam UUID bookId,
			@RequestParam("file") MultipartFile file) throws IOException {
		UUID uid = userId(authentication);
		return storedFileService.uploadEbook(uid, bookId, file);
	}

	@PostMapping(value = "/upload/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("hasRole('AUTHOR')")
	@Operation(summary = "Uploader une couverture")
	public FileUploadResponse uploadCover(
			Authentication authentication,
			@RequestParam UUID bookId,
			@RequestParam("file") MultipartFile file) throws IOException {
		UUID uid = userId(authentication);
		return storedFileService.uploadCover(uid, bookId, file);
	}

	@PostMapping(value = "/upload/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("isAuthenticated()")
	@Operation(summary = "Uploader un avatar (profil du JWT)")
	public FileUploadResponse uploadAvatar(
			Authentication authentication,
			@RequestParam("file") MultipartFile file) throws IOException {
		UUID uid = userId(authentication);
		return storedFileService.uploadAvatar(uid, file);
	}

	@GetMapping("/ebook/{bookId}/download")
	@PreAuthorize("isAuthenticated()")
	@Operation(summary = "Télécharger l'e-book (achat vérifié via order-service)")
	public ResponseEntity<Resource> downloadEbook(
			Authentication authentication,
			@PathVariable UUID bookId) throws IOException {
		UUID uid = userId(authentication);
		var desc = storedFileService.prepareEbookDownload(uid, bookId);
		FileSystemResource resource = new FileSystemResource(desc.path().toFile());
		long len = Files.size(desc.path());
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + escapeFilename(desc.downloadName()) + "\"")
				.contentType(MediaType.parseMediaType(desc.mimeType()))
				.contentLength(len)
				.body(resource);
	}

	@GetMapping("/cover/{bookId}")
	@Operation(summary = "Couverture publique")
	public ResponseEntity<Resource> downloadCover(@PathVariable UUID bookId) throws IOException {
		var desc = storedFileService.prepareCoverDownload(bookId);
		FileSystemResource resource = new FileSystemResource(desc.path().toFile());
		long len = Files.size(desc.path());
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + escapeFilename(desc.downloadName()) + "\"")
				.contentType(MediaType.parseMediaType(desc.mimeType()))
				.contentLength(len)
				.body(resource);
	}

	@GetMapping("/avatar/{userId}")
	@Operation(summary = "Avatar public")
	public ResponseEntity<Resource> downloadAvatar(@PathVariable UUID userId) throws IOException {
		var desc = storedFileService.prepareAvatarDownload(userId);
		FileSystemResource resource = new FileSystemResource(desc.path().toFile());
		long len = Files.size(desc.path());
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + escapeFilename(desc.downloadName()) + "\"")
				.contentType(MediaType.parseMediaType(desc.mimeType()))
				.contentLength(len)
				.body(resource);
	}

	@DeleteMapping("/{fileId}")
	@PreAuthorize("isAuthenticated()")
	@Operation(summary = "Supprimer un fichier (auteur du dépôt ou ADMIN)")
	public ResponseEntity<Void> delete(Authentication authentication, @PathVariable Long fileId) {
		UUID uid = userId(authentication);
		boolean admin = isAdmin(authentication);
		storedFileService.deleteIfAllowed(fileId, uid, admin);
		return ResponseEntity.noContent().build();
	}

	private static UUID userId(Authentication authentication) {
		if (authentication instanceof JwtAuthenticationToken jwt) {
			return UUID.fromString(jwt.getName());
		}
		throw new IllegalStateException("JWT attendu.");
	}

	private static boolean isAdmin(Authentication authentication) {
		return authentication.getAuthorities().stream()
				.map(GrantedAuthority::getAuthority)
				.anyMatch("ROLE_ADMIN"::equals);
	}

	private static String escapeFilename(String name) {
		return name.replaceAll("[\\\\\"\\r\\n]", "_");
	}
}
