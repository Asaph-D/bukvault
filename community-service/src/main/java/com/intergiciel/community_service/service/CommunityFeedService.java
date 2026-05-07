package com.intergiciel.community_service.service;

import com.intergiciel.community_service.repository.BuddySuggestionRepository;
import com.intergiciel.community_service.repository.CommunityEventRepository;
import com.intergiciel.community_service.repository.CommunityThreadRepository;
import com.intergiciel.community_service.repository.HubStatRepository;
import com.intergiciel.community_service.web.dto.BuddyResponse;
import com.intergiciel.community_service.web.dto.EventResponse;
import com.intergiciel.community_service.web.dto.HubResponse;
import com.intergiciel.community_service.web.dto.ThreadResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class CommunityFeedService {

	private static final ZoneId ZONE_CM = ZoneId.of("Africa/Douala");

	private final HubStatRepository hubStatRepository;
	private final CommunityThreadRepository threadRepository;
	private final CommunityEventRepository eventRepository;
	private final BuddySuggestionRepository buddyRepository;

	public CommunityFeedService(HubStatRepository hubStatRepository,
			CommunityThreadRepository threadRepository,
			CommunityEventRepository eventRepository,
			BuddySuggestionRepository buddyRepository) {
		this.hubStatRepository = hubStatRepository;
		this.threadRepository = threadRepository;
		this.eventRepository = eventRepository;
		this.buddyRepository = buddyRepository;
	}

	@Transactional(readOnly = true)
	public HubResponse hub() {
		return hubStatRepository.findById((short) 1)
				.map(h -> new HubResponse(h.getActiveReaders(), h.getOpenSalons(),
						h.getTagline() != null ? h.getTagline() : ""))
				.orElse(new HubResponse(0, 0, ""));
	}

	@Transactional(readOnly = true)
	public List<ThreadResponse> threads() {
		return threadRepository.findAllByOrderBySortIndexAsc().stream()
				.map(t -> new ThreadResponse(t.getId(), t.getTitle(), t.getChannel(), t.getParticipantCount(),
						t.isHot(), t.getLastActivityLabel()))
				.toList();
	}

	@Transactional(readOnly = true)
	public List<EventResponse> events() {
		DateTimeFormatter fmt = DateTimeFormatter.ofPattern("EEE d MMM · HH:mm", Locale.FRENCH).withZone(ZONE_CM);
		return eventRepository.findAllByOrderBySortIndexAsc().stream()
				.map(e -> new EventResponse(e.getId(), e.getTitle(), fmt.format(e.getStartsAt()), e.getTag(),
						e.getStartsAt()))
				.toList();
	}

	@Transactional(readOnly = true)
	public List<BuddyResponse> buddies(UUID viewerUserId) {
		return buddyRepository.findByViewerUserIdOrderBySortIndexAsc(viewerUserId).stream()
				.map(b -> new BuddyResponse(b.getId(), b.getDisplayName(), b.getReadingHint(), b.getMatchPercent()))
				.toList();
	}
}
