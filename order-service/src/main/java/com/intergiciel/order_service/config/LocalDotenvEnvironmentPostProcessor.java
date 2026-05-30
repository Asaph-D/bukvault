package com.intergiciel.order_service.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.PropertySource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Charge {@code .env} (racine du monorepo ou cwd) pour le dev local sans exporter les variables à la main.
 * Les variables déjà définies (OS, CI, Docker) ne sont pas écrasées.
 */
public class LocalDotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

	private static final String SOURCE_NAME = "bookvaultDotenv";

	@Override
	public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
		Path envFile = resolveEnvFile();
		if (envFile == null) {
			return;
		}
		Map<String, Object> fromFile = parseEnvFile(envFile);
		if (fromFile.isEmpty()) {
			return;
		}
		Map<String, Object> toApply = new LinkedHashMap<>();
		for (Map.Entry<String, Object> entry : fromFile.entrySet()) {
			String key = entry.getKey();
			if (!environment.containsProperty(key)) {
				toApply.put(key, entry.getValue());
				continue;
			}
			String existing = environment.getProperty(key);
			if (existing == null || existing.isBlank()) {
				toApply.put(key, entry.getValue());
			}
		}
		if (toApply.isEmpty()) {
			return;
		}
		PropertySource<?> source = new MapPropertySource(SOURCE_NAME, toApply);
		environment.getPropertySources().addFirst(source);
	}

	private static Path resolveEnvFile() {
		Path cwd = Path.of("").toAbsolutePath().normalize();
		List<Path> candidates = List.of(
				cwd.resolve(".env"),
				cwd.resolve("..").resolve(".env"),
				cwd.resolve("..").resolve("..").resolve(".env"));
		for (Path candidate : candidates) {
			if (Files.isRegularFile(candidate)) {
				return candidate;
			}
		}
		return null;
	}

	private static Map<String, Object> parseEnvFile(Path envFile) {
		Map<String, Object> result = new LinkedHashMap<>();
		try {
			for (String rawLine : Files.readAllLines(envFile)) {
				String line = rawLine.trim();
				if (line.isEmpty() || line.startsWith("#")) {
					continue;
				}
				int eq = line.indexOf('=');
				if (eq < 1) {
					continue;
				}
				String key = line.substring(0, eq).trim();
				String value = line.substring(eq + 1).trim();
				if ((value.startsWith("\"") && value.endsWith("\""))
						|| (value.startsWith("'") && value.endsWith("'"))) {
					value = value.substring(1, value.length() - 1);
				}
				if (!key.isEmpty()) {
					result.put(key, value);
				}
			}
		} catch (IOException ignored) {
			return Map.of();
		}
		return result;
	}
}
