package com.intergiciel.catalog_service.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public final class SlugUtil {

	private static final Pattern NON_LATIN = Pattern.compile("[^\\w-]");

	private SlugUtil() {
	}

	public static String slugify(String input) {
		if (input == null || input.isBlank()) {
			return "item";
		}
		String no = Normalizer.normalize(input.trim(), Normalizer.Form.NFD);
		String s = Pattern.compile("\\p{InCombiningDiacriticalMarks}+").matcher(no).replaceAll("");
		s = s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9\\s-]", "");
		s = s.replaceAll("\\s+", "-");
		s = s.replaceAll("-+", "-");
		if (s.isEmpty() || s.equals("-")) {
			return "item";
		}
		return s;
	}
}
