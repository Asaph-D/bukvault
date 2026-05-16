package com.intergiciel.admin_service.service;

import com.intergiciel.admin_service.client.CategoryShareDto;
import com.intergiciel.admin_service.client.DailyCountDto;
import com.intergiciel.admin_service.client.PlatformCatalogStatsDto;
import com.intergiciel.admin_service.client.PlatformReadingStatsDto;
import com.intergiciel.admin_service.client.PlatformReviewStatsDto;
import com.intergiciel.admin_service.client.PlatformUserStatsDto;
import com.intergiciel.admin_service.client.TopAuthorViewsDto;
import com.intergiciel.admin_service.client.UserBriefDto;
import com.intergiciel.admin_service.web.dto.AdminCategoryShareDto;
import com.intergiciel.admin_service.web.dto.AdminDashboardResponse;
import com.intergiciel.admin_service.web.dto.AdminKpiDto;
import com.intergiciel.admin_service.web.dto.AdminTopAuthorDto;
import com.intergiciel.admin_service.web.dto.PendingBooksResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class AdminFacadeService {

	private static final String[] CATEGORY_COLORS = {
			"#34d399", "#2dd4bf", "#22c55e", "#10b981", "#64748b", "#6ee7b7", "#14b8a6"
	};

	private final RestClient catalogRestClient;
	private final RestClient userRestClient;
	private final RestClient readingRestClient;
	private final RestClient reviewRestClient;

	public AdminFacadeService(
			@Qualifier("catalogRestClient") RestClient catalogRestClient,
			@Qualifier("userRestClient") RestClient userRestClient,
			@Qualifier("readingRestClient") RestClient readingRestClient,
			@Qualifier("reviewRestClient") RestClient reviewRestClient) {
		this.catalogRestClient = catalogRestClient;
		this.userRestClient = userRestClient;
		this.readingRestClient = readingRestClient;
		this.reviewRestClient = reviewRestClient;
	}

	public AdminDashboardResponse dashboard(String authorizationHeader) {
		PlatformUserStatsDto users = fetchUserStats(authorizationHeader);
		PlatformCatalogStatsDto catalog = fetchCatalogStats(authorizationHeader);
		PlatformReadingStatsDto reading = fetchReadingStats(authorizationHeader);
		PlatformReviewStatsDto reviews = fetchReviewStats(authorizationHeader);

		List<Long> readCounts = reading != null
				? reading.readsByDay().stream().map(DailyCountDto::count).toList()
				: List.of();
		long readsTotal = readCounts.stream().mapToLong(Long::longValue).sum();
		long readsFirstHalf = readCounts.stream().limit(7).mapToLong(Long::longValue).sum();
		long readsSecondHalf = readCounts.stream().skip(7).mapToLong(Long::longValue).sum();

		List<AdminKpiDto> kpis = List.of(
				kpi("Utilisateurs", users.totalUsers(), users.newUsersLast30Days(), users.newUsersPrevious30Days(), "success"),
				kpi("Livres publiés", catalog.publishedBooks(), catalog.newPublishedLast30Days(), catalog.newPublishedPrevious30Days(), "success"),
				kpi("Lectures (14 j)", readsTotal, readsSecondHalf, readsFirstHalf, "info"),
				kpi("Nouveaux comptes", users.newUsersLast30Days(), users.newUsersLast30Days(), users.newUsersPrevious30Days(), "warn"));

		List<Long> readsByDay = reading != null
				? reading.readsByDay().stream().map(DailyCountDto::count).toList()
				: List.of();
		List<String> readsByDayLabels = reading != null
				? reading.readsByDay().stream().map(DailyCountDto::label).toList()
				: List.of();

		List<AdminCategoryShareDto> shares = new ArrayList<>();
		int colorIdx = 0;
		for (CategoryShareDto c : catalog.categoryShares()) {
			String color = CATEGORY_COLORS[colorIdx % CATEGORY_COLORS.length];
			shares.add(new AdminCategoryShareDto(c.name(), c.pct(), color));
			colorIdx++;
		}

		List<AdminTopAuthorDto> topAuthors = buildTopAuthors(catalog.topAuthors(), authorizationHeader);

		List<Long> activity = reading != null
				? reading.activityByWeekday().stream().map(DailyCountDto::count).toList()
				: List.of();
		List<String> activityLabels = reading != null
				? reading.activityByWeekday().stream().map(DailyCountDto::label).toList()
				: List.of();

		long openReports = reviews != null ? reviews.openReports() : 0L;

		return new AdminDashboardResponse(
				kpis,
				readsByDay,
				readsByDayLabels,
				catalog.totalViews(),
				shares,
				topAuthors,
				activity,
				activityLabels,
				catalog.pendingModeration(),
				openReports,
				null);
	}

	public PendingBooksResponse pendingBooks() {
		return new PendingBooksResponse(Collections.emptyList(),
				"Utilisez la page Validations pour modérer les brouillons.");
	}

	public ResponseEntity<String> publishBook(UUID bookId, String authorizationHeader, boolean publish) {
		try {
			String body = catalogRestClient.patch()
					.uri("/api/v1/books/{id}/publish", bookId)
					.header(HttpHeaders.AUTHORIZATION, authorizationHeader)
					.contentType(MediaType.APPLICATION_JSON)
					.body(new com.intergiciel.admin_service.web.dto.PublishBookPayload(publish))
					.retrieve()
					.body(String.class);
			return ResponseEntity.ok(body);
		}
		catch (RestClientException ex) {
			throw ex;
		}
	}

	private List<AdminTopAuthorDto> buildTopAuthors(List<TopAuthorViewsDto> authors, String auth) {
		if (authors == null || authors.isEmpty()) {
			return List.of();
		}
		long maxViews = authors.stream().mapToLong(TopAuthorViewsDto::totalViews).max().orElse(1L);
		List<AdminTopAuthorDto> out = new ArrayList<>();
		for (TopAuthorViewsDto a : authors) {
			String name = resolveAuthorName(a.authorUserId(), auth);
			int load = maxViews > 0 ? (int) Math.round(a.totalViews() * 100.0 / maxViews) : 0;
			out.add(new AdminTopAuthorDto(name, formatCompact(a.totalViews()), load));
		}
		return out;
	}

	private String resolveAuthorName(UUID authorId, String auth) {
		try {
			UserBriefDto user = userRestClient.get()
					.uri("/api/v1/users/{id}", authorId)
					.header(HttpHeaders.AUTHORIZATION, auth)
					.retrieve()
					.body(UserBriefDto.class);
			if (user != null && user.firstName() != null) {
				return (user.firstName() + " " + (user.lastName() != null ? user.lastName() : "")).trim();
			}
		}
		catch (RestClientException ignored) {
			// nom indisponible
		}
		return "Auteur " + authorId.toString().substring(0, 8);
	}

	private PlatformUserStatsDto fetchUserStats(String auth) {
		try {
			return userRestClient.get()
					.uri("/api/v1/users/stats/platform")
					.header(HttpHeaders.AUTHORIZATION, auth)
					.retrieve()
					.body(PlatformUserStatsDto.class);
		}
		catch (RestClientException ex) {
			return new PlatformUserStatsDto(0, 0, 0, List.of());
		}
	}

	private PlatformCatalogStatsDto fetchCatalogStats(String auth) {
		try {
			return catalogRestClient.get()
					.uri("/api/v1/catalog/stats/platform")
					.header(HttpHeaders.AUTHORIZATION, auth)
					.retrieve()
					.body(PlatformCatalogStatsDto.class);
		}
		catch (RestClientException ex) {
			return new PlatformCatalogStatsDto(0, 0, 0, 0, 0, 0, 0, List.of(), List.of());
		}
	}

	private PlatformReadingStatsDto fetchReadingStats(String auth) {
		try {
			return readingRestClient.get()
					.uri("/api/v1/reading/stats/platform")
					.header(HttpHeaders.AUTHORIZATION, auth)
					.retrieve()
					.body(PlatformReadingStatsDto.class);
		}
		catch (RestClientException ex) {
			return null;
		}
	}

	private PlatformReviewStatsDto fetchReviewStats(String auth) {
		try {
			return reviewRestClient.get()
					.uri("/api/v1/reviews/stats/platform")
					.header(HttpHeaders.AUTHORIZATION, auth)
					.retrieve()
					.body(PlatformReviewStatsDto.class);
		}
		catch (RestClientException ex) {
			return new PlatformReviewStatsDto(0);
		}
	}

	private static AdminKpiDto kpi(String label, long value, long current, long previous, String severity) {
		Delta d = delta(current, previous);
		return new AdminKpiDto(label, value, d.text(), d.up(), severity);
	}

	private static Delta delta(long current, long previous) {
		if (previous <= 0) {
			if (current > 0) {
				return new Delta("+100 %", true);
			}
			return new Delta("—", true);
		}
		double pct = ((current - previous) * 100.0) / previous;
		boolean up = pct >= 0;
		String sign = up ? "+" : "";
		return new Delta(sign + String.format(Locale.FRANCE, "%.0f %%", pct), up);
	}

	private static String formatCompact(long n) {
		if (n >= 1_000_000) {
			return String.format(Locale.FRANCE, "%.1fM", n / 1_000_000.0);
		}
		if (n >= 1_000) {
			return String.format(Locale.FRANCE, "%.1fk", n / 1_000.0);
		}
		return String.valueOf(n);
	}

	private record Delta(String text, boolean up) {
	}
}
