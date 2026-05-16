package com.intergiciel.reading_service.service;

import com.intergiciel.reading_service.repository.ReadingProgressRepository;
import com.intergiciel.reading_service.web.dto.DailyCountDto;
import com.intergiciel.reading_service.web.dto.PlatformReadingStatsResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class ReadingPlatformStatsService {

	private static final int READ_DAYS = 14;
	private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ofPattern("dd/MM").withZone(ZoneOffset.UTC);
	private final ReadingProgressRepository readingProgressRepository;

	public ReadingPlatformStatsService(ReadingProgressRepository readingProgressRepository) {
		this.readingProgressRepository = readingProgressRepository;
	}

	@Transactional(readOnly = true)
	public PlatformReadingStatsResponse stats() {
		Instant now = Instant.now();
		Instant readSince = now.minus(READ_DAYS, ChronoUnit.DAYS);
		Instant weekSince = now.minus(7, ChronoUnit.DAYS);

		Map<String, Long> readsByDayMap = new HashMap<>();
		for (Object[] row : readingProgressRepository.countUpdatesGroupedByDay(readSince)) {
			readsByDayMap.put(row[0].toString(), ((Number) row[1]).longValue());
		}

		List<DailyCountDto> readsByDay = new ArrayList<>();
		for (int i = READ_DAYS - 1; i >= 0; i--) {
			Instant day = now.minus(i, ChronoUnit.DAYS).truncatedTo(ChronoUnit.DAYS);
			String key = day.toString().substring(0, 10);
			readsByDay.add(new DailyCountDto(DAY_FMT.format(day), readsByDayMap.getOrDefault(key, 0L)));
		}

		Map<Integer, Long> weekdayMap = new HashMap<>();
		for (Object[] row : readingProgressRepository.countUpdatesGroupedByWeekday(weekSince)) {
			int dow = ((Number) row[0]).intValue();
			weekdayMap.put(dow, ((Number) row[1]).longValue());
		}

		List<DailyCountDto> activityByWeekday = new ArrayList<>();
		for (DayOfWeek dow : List.of(
				DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY,
				DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY)) {
			int pgDow = dow.getValue() % 7;
			String label = dow.getDisplayName(TextStyle.SHORT, Locale.FRENCH);
			label = label.substring(0, 1).toUpperCase() + label.substring(1, Math.min(3, label.length()));
			activityByWeekday.add(new DailyCountDto(label, weekdayMap.getOrDefault(pgDow, 0L)));
		}

		return new PlatformReadingStatsResponse(readsByDay, activityByWeekday);
	}
}
