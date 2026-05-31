package com.intergiciel.community_service.service;

import com.intergiciel.community_service.domain.ChatMessageEntity;
import com.intergiciel.community_service.domain.ConversationEntity;
import com.intergiciel.community_service.domain.ConversationMemberEntity;
import com.intergiciel.community_service.domain.ConversationMemberId;
import com.intergiciel.community_service.domain.ConversationType;
import com.intergiciel.community_service.repository.ChatMessageRepository;
import com.intergiciel.community_service.repository.ConversationMemberRepository;
import com.intergiciel.community_service.repository.ConversationRepository;
import com.intergiciel.community_service.web.dto.ChatMessageResponse;
import com.intergiciel.community_service.web.dto.ConversationSummaryResponse;
import com.intergiciel.community_service.web.dto.MemberSnapshot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class MessagingService {

	private final ConversationRepository conversationRepository;
	private final ConversationMemberRepository memberRepository;
	private final ChatMessageRepository chatMessageRepository;
	private final MemberProfileService memberProfileService;
	private final CommunityRealtimePublisher realtimePublisher;

	public MessagingService(
			ConversationRepository conversationRepository,
			ConversationMemberRepository memberRepository,
			ChatMessageRepository chatMessageRepository,
			MemberProfileService memberProfileService,
			CommunityRealtimePublisher realtimePublisher) {
		this.conversationRepository = conversationRepository;
		this.memberRepository = memberRepository;
		this.chatMessageRepository = chatMessageRepository;
		this.memberProfileService = memberProfileService;
		this.realtimePublisher = realtimePublisher;
	}

	@Transactional(readOnly = true)
	public List<ConversationSummaryResponse> listConversations(UUID currentUserId) {
		List<ConversationMemberEntity> mine = memberRepository.findById_UserIdOrderById_ConversationId(currentUserId);
		List<ConversationSummaryResponse> out = new ArrayList<>();
		for (ConversationMemberEntity m : mine) {
			UUID cid = m.getId().getConversationId();
			ConversationEntity c = conversationRepository.findById(cid).orElse(null);
			if (c == null) {
				continue;
			}
			out.add(toSummary(currentUserId, c));
		}
		out.sort(Comparator.comparing(ConversationSummaryResponse::updatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
				.reversed());
		return out;
	}

	@Transactional
	public ConversationSummaryResponse startDirect(UUID currentUserId, UUID participantId) {
		if (participantId.equals(currentUserId)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Destinataire invalide.");
		}
		List<UUID> existing = conversationRepository.findDirectBetween(currentUserId, participantId, ConversationType.DIRECT);
		if (!existing.isEmpty()) {
			UUID cid = existing.get(0);
			ConversationEntity c = conversationRepository.findById(cid).orElseThrow();
			return toSummary(currentUserId, c);
		}
		Instant now = Instant.now();
		UUID cid = UUID.randomUUID();
		ConversationEntity conv = new ConversationEntity();
		conv.setId(cid);
		conv.setType(ConversationType.DIRECT);
		conv.setCreatedAt(now);
		conv.setUpdatedAt(now);
		conv.setLastMessagePreview(null);
		conversationRepository.save(conv);
		memberRepository.save(new ConversationMemberEntity(cid, currentUserId));
		memberRepository.save(new ConversationMemberEntity(cid, participantId));
		return toSummary(currentUserId, conv);
	}

	@Transactional(readOnly = true)
	public Page<ChatMessageResponse> messages(UUID currentUserId, UUID conversationId, Pageable pageable) {
		assertMember(conversationId, currentUserId);
		Page<ChatMessageEntity> page = chatMessageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId,
				pageable);
		List<ChatMessageResponse> asc = page.getContent().stream()
				.sorted(Comparator.comparing(ChatMessageEntity::getCreatedAt))
				.map(this::toMessageResponse)
				.toList();
		return new PageImpl<>(asc, pageable, page.getTotalElements());
	}

	@Transactional
	public ChatMessageResponse send(UUID currentUserId, UUID conversationId, String content) {
		assertMember(conversationId, currentUserId);
		Instant now = Instant.now();
		ChatMessageEntity msg = new ChatMessageEntity();
		msg.setId(UUID.randomUUID());
		msg.setConversationId(conversationId);
		msg.setSenderId(currentUserId);
		msg.setContent(content);
		msg.setCreatedAt(now);
		chatMessageRepository.save(msg);

		String preview = content.length() > 160 ? content.substring(0, 157) + "…" : content;
		ConversationEntity c = conversationRepository.findById(conversationId).orElseThrow();
		c.setUpdatedAt(now);
		c.setLastMessagePreview(preview);
		conversationRepository.save(c);

		ChatMessageResponse response = toMessageResponse(msg);
		realtimePublisher.publishDirectMessage(conversationId, response);

		for (ConversationMemberEntity member : memberRepository.findById_ConversationId(conversationId)) {
			UUID memberId = member.getId().getUserId();
			realtimePublisher.publishInboxUpdate(memberId, toSummary(memberId, c));
		}
		return response;
	}

	private ConversationSummaryResponse toSummary(UUID viewerId, ConversationEntity c) {
		List<ConversationMemberEntity> others = memberRepository.findOthersInConversation(c.getId(), viewerId);
		UUID peer = others.stream().findFirst().map(x -> x.getId().getUserId()).orElse(null);
		MemberSnapshot peerProfile = peer != null ? memberProfileService.snapshot(peer) : null;
		return new ConversationSummaryResponse(
				c.getId(),
				peer,
				peerProfile != null ? peerProfile.email() : null,
				peerProfile != null ? peerProfile.displayName() : null,
				peerProfile != null ? peerProfile.avatarUrl() : null,
				c.getLastMessagePreview(),
				c.getUpdatedAt());
	}

	private ChatMessageResponse toMessageResponse(ChatMessageEntity msg) {
		MemberSnapshot sender = memberProfileService.snapshot(msg.getSenderId());
		return new ChatMessageResponse(
				msg.getId(),
				msg.getSenderId(),
				sender.email(),
				sender.displayName(),
				sender.avatarUrl(),
				msg.getContent(),
				msg.getCreatedAt());
	}

	private void assertMember(UUID conversationId, UUID userId) {
		if (!memberRepository.existsById(new ConversationMemberId(conversationId, userId))) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès à la conversation refusé.");
		}
	}
}
