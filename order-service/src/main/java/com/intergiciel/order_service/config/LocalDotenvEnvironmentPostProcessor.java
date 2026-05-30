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
import java.util.Map;

/**
 * Charge {@code .env} (recherche depuis le cwd vers les parents) et mappe vers les clés Spring
 * ({@code order.g2tpay.*}) pour que G2TPay fonctionne sans exporter les variables à la main.
 */
public class LocalDotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

	private static final String SOURCE_NAME = "bookvaultDotenv";

	private static final Map<String, String> ENV_TO_SPRING = Map.ofEntries(
			Map.entry("G2TPAY_ENABLED", "order.g2tpay.enabled"),
			Map.entry("G2TPAY_API_KEY", "order.g2tpay.api-key"),
			Map.entry("G2TPAY_BASE_URL", "order.g2tpay.base-url"),
			Map.entry("G2TPAY_WEBHOOK_URL", "order.g2tpay.webhook-url"),
			Map.entry("GATEWAY_PUBLIC_URL", "order.g2tpay.gateway-public-url"),
			Map.entry("G2TPAY_EUR_TO_XAF_RATE", "order.g2tpay.eur-to-xaf-rate"),
			Map.entry("G2TPAY_OPERATOR_MTN", "order.g2tpay.operator-mtn"),
			Map.entry("G2TPAY_OPERATOR_ORANGE", "order.g2tpay.operator-orange"),
			Map.entry("FRONTEND_URL", "order.frontend.base-url"));

	@Override
	public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
		Path envFile = resolveEnvFile();
		if (envFile == null) {
			System.out.println("[bookvault] .env introuvable — G2TPay : utilisez application-local.properties ou exportez les variables.");
			return;
		}
		Map<String, Object> fromFile = parseEnvFile(envFile);
		if (fromFile.isEmpty()) {
			return;
		}
		Map<String, Object> toApply = new LinkedHashMap<>();
		for (Map.Entry<String, Object> entry : fromFile.entrySet()) {
			putIfUsable(environment, toApply, entry.getKey(), entry.getValue());
		}
		for (Map.Entry<String, String> mapping : ENV_TO_SPRING.entrySet()) {
			Object value = fromFile.get(mapping.getKey());
			if (value != null && !value.toString().isBlank()) {
				putIfUsable(environment, toApply, mapping.getValue(), value);
			}
		}
		if (toApply.isEmpty()) {
			return;
		}
		PropertySource<?> source = new MapPropertySource(SOURCE_NAME, toApply);
		environment.getPropertySources().addFirst(source);
		System.out.println("[bookvault] .env chargé depuis " + envFile.toAbsolutePath()
				+ " (" + toApply.size() + " propriétés G2TPay / frontend)");
	}

	private static void putIfUsable(
			ConfigurableEnvironment environment, Map<String, Object> target, String key, Object value) {
		if (value == null || value.toString().isBlank()) {
			return;
		}
		String existing = environment.getProperty(key);
		if (existing != null && !existing.isBlank()) {
			return;
		}
		target.put(key, value);
	}

	private static Path resolveEnvFile() {
		Path start = Path.of("").toAbsolutePath().normalize();
		for (int depth = 0; depth < 8 && start != null; depth++) {
			Path candidate = start.resolve(".env");
			if (Files.isRegularFile(candidate)) {
				return candidate;
			}
			start = start.getParent();
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
