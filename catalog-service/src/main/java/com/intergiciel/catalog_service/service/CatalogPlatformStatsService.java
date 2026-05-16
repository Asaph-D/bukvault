package com.intergiciel.catalog_service.service;

import com.intergiciel.catalog_service.domain.BookStatus;
import com.intergiciel.catalog_service.repository.BookRepository;
import com.intergiciel.catalog_service.web.dto.CategoryShareDto;
import com.intergiciel.catalog_service.web.dto.PlatformCatalogStatsResponse;
import com.intergiciel.catalog_service.web.dto.TopAuthorViewsDto;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class CatalogPlatformStatsService {

	private static final int TOP_AUTHORS = 5;

	private final BookRepository bookRepository;

	public CatalogPlatformStatsService(BookRepository bookRepository) {
		this.bookRepository = bookRepository;
	}

	@Transactional(readOnly = true)
	public PlatformCatalogStatsResponse stats() {
		Instant now = Instant.now();
		Instant last30 = now.minus(30, ChronoUnit.DAYS);
		Instant prev30Start = now.minus(60, ChronoUnit.DAYS);

		long published = bookRepository.countByDeletedFalseAndStatus(BookStatus.PUBLISHED);
		long newPubLast30 = bookRepository.countByDeletedFalseAndStatusAndPublishedAtGreaterThanEqual(
				BookStatus.PUBLISHED, last30);
		long newPubPrev30 = bookRepository.countByDeletedFalseAndStatusAndPublishedAtGreaterThanEqualAndPublishedAtLessThan(
				BookStatus.PUBLISHED, prev30Start, last30);
		long pending = bookRepository.countByDeletedFalseAndStatus(BookStatus.DRAFT);
		long totalViews = bookRepository.sumViewCountPublished();
		long viewsLast30 = bookRepository.sumViewCountPublishedUpdatedSince(last30);
		long viewsPrev30 = bookRepository.sumViewCountPublishedUpdatedBetween(prev30Start, last30);

		List<CategoryShareDto> shares = buildCategoryShares();
		List<TopAuthorViewsDto> topAuthors = buildTopAuthors();

		return new PlatformCatalogStatsResponse(
				published, newPubLast30, newPubPrev30, pending, totalViews, viewsLast30, viewsPrev30, shares, topAuthors);
	}

	private List<CategoryShareDto> buildCategoryShares() {
		List<Object[]> rows = bookRepository.sumViewsByCategoryPublished();
		long total = rows.stream().mapToLong(r -> ((Number) r[1]).longValue()).sum();
		List<CategoryShareDto> out = new ArrayList<>();
		for (Object[] row : rows) {
			String name = (String) row[0];
			long views = ((Number) row[1]).longValue();
			int pct = total > 0 ? (int) Math.round(views * 100.0 / total) : 0;
			out.add(new CategoryShareDto(name, views, pct));
		}
		return out;
	}

	private List<TopAuthorViewsDto> buildTopAuthors() {
		List<TopAuthorViewsDto> out = new ArrayList<>();
		for (Object[] row : bookRepository.topAuthorsByViews(PageRequest.of(0, TOP_AUTHORS))) {
			UUID authorId = (UUID) row[0];
			long views = ((Number) row[1]).longValue();
			out.add(new TopAuthorViewsDto(authorId, views));
		}
		return out;
	}
}
