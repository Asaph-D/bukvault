package com.intergiciel.file_service.service;

import com.intergiciel.file_service.config.FileProperties;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Component
public class LocalDiskStorage {

	private final FileProperties fileProperties;

	public LocalDiskStorage(FileProperties fileProperties) {
		this.fileProperties = fileProperties;
	}

	@PostConstruct
	void ensureRoot() throws IOException {
		Files.createDirectories(root());
	}

	public Path root() {
		return Path.of(fileProperties.getStorage().getRoot()).toAbsolutePath().normalize();
	}

	public String saveUnderPrefix(String prefix, String originalName, InputStream data) throws IOException {
		String safeName = sanitizeFilename(originalName);
		String unique = UUID.randomUUID().toString();
		Path relative = Path.of(prefix, unique + extensionOf(safeName));
		Path target = root().resolve(relative).normalize();
		if (!target.startsWith(root())) {
			throw new IOException("Chemin de stockage invalide.");
		}
		Files.createDirectories(target.getParent());
		try (OutputStream out = Files.newOutputStream(target)) {
			data.transferTo(out);
		}
		return relative.toString().replace('\\', '/');
	}

	public Path resolveFile(String storageKey) {
		Path p = root().resolve(storageKey).normalize();
		if (!p.startsWith(root())) {
			throw new SecurityException("Accès fichier refusé.");
		}
		return p;
	}

	public void deleteIfExists(String storageKey) throws IOException {
		Path p = resolveFile(storageKey);
		Files.deleteIfExists(p);
	}

	private static String sanitizeFilename(String name) {
		if (name == null || name.isBlank()) {
			return "file.bin";
		}
		String base = Path.of(name).getFileName().toString();
		return base.replaceAll("[^a-zA-Z0-9._-]", "_");
	}

	private static String extensionOf(String name) {
		int i = name.lastIndexOf('.');
		if (i <= 0 || i == name.length() - 1) {
			return "";
		}
		return name.substring(i);
	}

}
