package com.intergiciel.user_service.service;

import com.intergiciel.user_service.repository.UserProfileRepository;
import com.intergiciel.user_service.web.dto.DailyCountDto;
import com.intergiciel.user_service.web.dto.PlatformUserStatsResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PlatformUserStatsService {

	private static final int REGISTRATION_DAYS = 14;
	private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ofPattern("dd/MM").withZone(ZoneOffset.UTC);

	private final UserProfileRepository userProfileRepository;

	public PlatformUserStatsService(UserProfileRepository userProfileRepository) {
		this.userProfileRepository = userProfileRepository;
	}

	@Transactional(readOnly = true)
	public PlatformUserStatsResponse stats() {
		Instant now = Instant.now();
		Instant last30 = now.minus(30, ChronoUnit.DAYS);
		Instant prev30Start = now.minus(60, ChronoUnit.DAYS);
		Instant regSince = now.minus(REGISTRATION_DAYS, ChronoUnit.DAYS);

		long total = userProfileRepository.count();
		long newLast30 = userProfileRepository.countByCreatedAtGreaterThanEqual(last30);
		long newPrev30 = userProfileRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(prev30Start, last30);

		Map<String, Long> byDay = new HashMap<>();
		for (Object[] row : userProfileRepository.countRegistrationsGroupedByDay(regSince)) {
			String dayKey = row[0].toString();
			long cnt = ((Number) row[1]).longValue();
			byDay.put(dayKey, cnt);
		}

		List<DailyCountDto> registrations = new ArrayList<>();
		for (int i = REGISTRATION_DAYS - 1; i >= 0; i--) {
			Instant day = now.minus(i, ChronoUnit.DAYS).truncatedTo(ChronoUnit.DAYS);
			String key = day.toString().substring(0, 10);
			registrations.add(new DailyCountDto(DAY_FMT.format(day), byDay.getOrDefault(key, 0L)));
		}

		return new PlatformUserStatsResponse(total, newLast30, newPrev30, registrations);
	}
}
