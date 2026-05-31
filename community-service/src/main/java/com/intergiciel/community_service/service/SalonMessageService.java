package com.intergiciel.community_service.service;

import com.intergiciel.community_service.domain.SalonMessageEntity;
import com.intergiciel.community_service.repository.SalonMessageRepository;
import com.intergiciel.community_service.web.dto.SalonMessageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class SalonMessageService {

	private final SalonMessageRepository salonMessageRepository;
	private final MemberProfileService memberProfileService;
	private final CommunityRealtimePublisher realtimePublisher;

	public SalonMessageService(
			SalonMessageRepository salonMessageRepository,
			MemberProfileService memberProfileService,
			CommunityRealtimePublisher realtimePublisher) {
		this.salonMessageRepository = salonMessageRepository;
		this.memberProfileService = memberProfileService;
		this.realtimePublisher = realtimePublisher;
	}

	@Transactional(readOnly = true)
	public Page<SalonMessageResponse> list(UUID threadId, Pageable pageable) {
		Page<SalonMessageEntity> page = salonMessageRepository.findByThreadIdOrderByCreatedAtDesc(threadId, pageable);
		List<SalonMessageResponse> asc = page.getContent().stream()
				.sorted(Comparator.comparing(SalonMessageEntity::getCreatedAt))
				.map(this::toResponse)
				.toList();
		return new PageImpl<>(asc, pageable, page.getTotalElements());
	}

	@Transactional
	public SalonMessageResponse send(UUID threadId, UUID senderId, String content) {
		Instant now = Instant.now();
		SalonMessageEntity entity = new SalonMessageEntity();
		entity.setId(UUID.randomUUID());
		entity.setThreadId(threadId);
		entity.setSenderId(senderId);
		entity.setContent(content.trim());
		entity.setCreatedAt(now);
		salonMessageRepository.save(entity);
		SalonMessageResponse response = toResponse(entity);
		realtimePublisher.publishSalonMessage(threadId, response);
		return response;
	}

	private SalonMessageResponse toResponse(SalonMessageEntity msg) {
		var sender = memberProfileService.snapshot(msg.getSenderId());
		return new SalonMessageResponse(
				msg.getId(),
				msg.getThreadId(),
				msg.getSenderId(),
				sender.email(),
				sender.displayName(),
				sender.avatarUrl(),
				msg.getContent(),
				msg.getCreatedAt());
	}
}
