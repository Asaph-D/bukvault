package com.intergiciel.file_service.service;

import com.intergiciel.file_service.domain.FileKind;
import com.intergiciel.file_service.domain.StoredFileEntity;
import com.intergiciel.file_service.repository.StoredFileRepository;
import com.intergiciel.file_service.web.dto.FileUploadResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class StoredFileService {

	private static final Set<String> EBOOK_MIMES = Set.of(
			"application/pdf",
			"application/epub+zip",
			"application/x-mobipocket-ebook");

	private static final Set<String> IMAGE_MIMES = Set.of(
			"image/jpeg",
			"image/png",
			"image/webp");

	private final StoredFileRepository storedFileRepository;
	private final LocalDiskStorage localDiskStorage;
	private final OrderEntitlementClient orderEntitlementClient;

	public StoredFileService(StoredFileRepository storedFileRepository,
			LocalDiskStorage localDiskStorage,
			OrderEntitlementClient orderEntitlementClient) {
		this.storedFileRepository = storedFileRepository;
		this.localDiskStorage = localDiskStorage;
		this.orderEntitlementClient = orderEntitlementClient;
	}

	@Transactional
	public FileUploadResponse uploadEbook(UUID uploadedBy, UUID bookId, MultipartFile file) throws IOException {
		requireNonEmpty(file);
		String mime = normalizeMime(file);
		if (!EBOOK_MIMES.contains(mime)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Format e-book non supporté (PDF, EPUB, MOBI).");
		}
		replaceExistingForBook(bookId, FileKind.EBOOK);
		String prefix = "ebooks/" + bookId;
		String key = localDiskStorage.saveUnderPrefix(prefix, file.getOriginalFilename(), file.getInputStream());
		StoredFileEntity entity = new StoredFileEntity(
				file.getOriginalFilename(),
				FileKind.EBOOK,
				mime,
				file.getSize(),
				key,
				bookId,
				null,
				uploadedBy);
		StoredFileEntity saved = storedFileRepository.save(entity);
		return new FileUploadResponse(saved.getId(), bookId, mime, saved.getSizeBytes());
	}

	@Transactional
	public FileUploadResponse uploadCover(UUID uploadedBy, UUID bookId, MultipartFile file) throws IOException {
		requireNonEmpty(file);
		String mime = normalizeMime(file);
		if (!IMAGE_MIMES.contains(mime)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image couverture : JPEG, PNG ou WebP.");
		}
		replaceExistingForBook(bookId, FileKind.COVER);
		String prefix = "covers/" + bookId;
		String key = localDiskStorage.saveUnderPrefix(prefix, file.getOriginalFilename(), file.getInputStream());
		StoredFileEntity entity = new StoredFileEntity(
				file.getOriginalFilename(),
				FileKind.COVER,
				mime,
				file.getSize(),
				key,
				bookId,
				null,
				uploadedBy);
		StoredFileEntity saved = storedFileRepository.save(entity);
		return new FileUploadResponse(saved.getId(), bookId, mime, saved.getSizeBytes());
	}

	@Transactional
	public FileUploadResponse uploadAvatar(UUID ownerUserId, MultipartFile file) throws IOException {
		requireNonEmpty(file);
		String mime = normalizeMime(file);
		if (!IMAGE_MIMES.contains(mime)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Avatar : JPEG, PNG ou WebP.");
		}
		replaceExistingAvatar(ownerUserId);
		String prefix = "avatars/" + ownerUserId;
		String key = localDiskStorage.saveUnderPrefix(prefix, file.getOriginalFilename(), file.getInputStream());
		StoredFileEntity entity = new StoredFileEntity(
				file.getOriginalFilename(),
				FileKind.AVATAR,
				mime,
				file.getSize(),
				key,
				null,
				ownerUserId,
				ownerUserId);
		StoredFileEntity saved = storedFileRepository.save(entity);
		return new FileUploadResponse(saved.getId(), null, mime, saved.getSizeBytes());
	}

	@Transactional(readOnly = true)
	public DownloadDescriptor prepareEbookDownload(UUID userId, UUID bookId) {
		if (!orderEntitlementClient.hasBookAccess(userId, bookId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Livre non acheté ou droits insuffisants.");
		}
		StoredFileEntity file = storedFileRepository.findTopByBookIdAndKindOrderByIdDesc(bookId, FileKind.EBOOK)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fichier e-book introuvable."));
		Path path = localDiskStorage.resolveFile(file.getStorageKey());
		String name = Optional.ofNullable(file.getOriginalFilename()).orElse("ebook.bin");
		return new DownloadDescriptor(path, file.getMimeType(), name);
	}

	@Transactional(readOnly = true)
	public DownloadDescriptor prepareCoverDownload(UUID bookId) {
		StoredFileEntity file = storedFileRepository.findTopByBookIdAndKindOrderByIdDesc(bookId, FileKind.COVER)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Couverture introuvable."));
		Path path = localDiskStorage.resolveFile(file.getStorageKey());
		String name = Optional.ofNullable(file.getOriginalFilename()).orElse("cover.jpg");
		return new DownloadDescriptor(path, file.getMimeType(), name);
	}

	@Transactional(readOnly = true)
	public DownloadDescriptor prepareAvatarDownload(UUID userId) {
		StoredFileEntity file = storedFileRepository.findTopByOwnerUserIdAndKindOrderByIdDesc(userId, FileKind.AVATAR)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Avatar introuvable."));
		Path path = localDiskStorage.resolveFile(file.getStorageKey());
		String name = Optional.ofNullable(file.getOriginalFilename()).orElse("avatar.jpg");
		return new DownloadDescriptor(path, file.getMimeType(), name);
	}

	@Transactional
	public void deleteIfAllowed(Long fileId, UUID requesterUserId, boolean admin) {
		StoredFileEntity entity = storedFileRepository.findById(fileId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fichier introuvable."));
		if (!admin && !entity.getUploadedBy().equals(requesterUserId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Suppression non autorisée.");
		}
		removeEntityAndDisk(entity);
	}

	private void replaceExistingForBook(UUID bookId, FileKind kind) {
		storedFileRepository.findTopByBookIdAndKindOrderByIdDesc(bookId, kind)
				.ifPresent(this::removeEntityAndDisk);
	}

	private void replaceExistingAvatar(UUID ownerUserId) {
		storedFileRepository.findTopByOwnerUserIdAndKindOrderByIdDesc(ownerUserId, FileKind.AVATAR)
				.ifPresent(this::removeEntityAndDisk);
	}

	private void removeEntityAndDisk(StoredFileEntity entity) {
		try {
			localDiskStorage.deleteIfExists(entity.getStorageKey());
		}
		catch (IOException ex) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Échec suppression fichier disque.", ex);
		}
		storedFileRepository.delete(entity);
	}

	private static void requireNonEmpty(MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichier vide.");
		}
	}

	private static String normalizeMime(MultipartFile file) {
		String mime = file.getContentType();
		if (mime != null && !mime.isBlank()) {
			return mime.toLowerCase(Locale.ROOT).trim();
		}
		return "application/octet-stream";
	}

	public record DownloadDescriptor(Path path, String mimeType, String downloadName) {
	}
}
