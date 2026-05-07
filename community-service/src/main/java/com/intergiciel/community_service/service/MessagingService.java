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

	public MessagingService(ConversationRepository conversationRepository,
			ConversationMemberRepository memberRepository,
			ChatMessageRepository chatMessageRepository) {
		this.conversationRepository = conversationRepository;
		this.memberRepository = memberRepository;
		this.chatMessageRepository = chatMessageRepository;
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
			List<ConversationMemberEntity> others = memberRepository.findOthersInConversation(cid, currentUserId);
			UUID peer = others.stream().findFirst().map(x -> x.getId().getUserId()).orElse(null);
			out.add(new ConversationSummaryResponse(cid, peer, c.getLastMessagePreview(), c.getUpdatedAt()));
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
			return new ConversationSummaryResponse(cid, participantId, c.getLastMessagePreview(), c.getUpdatedAt());
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
		return new ConversationSummaryResponse(cid, participantId, null, now);
	}

	@Transactional(readOnly = true)
	public Page<ChatMessageResponse> messages(UUID currentUserId, UUID conversationId, Pageable pageable) {
		assertMember(conversationId, currentUserId);
		Page<ChatMessageEntity> page = chatMessageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId,
				pageable);
		List<ChatMessageResponse> asc = page.getContent().stream()
				.sorted(Comparator.comparing(ChatMessageEntity::getCreatedAt))
				.map(m -> new ChatMessageResponse(m.getId(), m.getSenderId(), m.getContent(), m.getCreatedAt()))
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

		return new ChatMessageResponse(msg.getId(), msg.getSenderId(), msg.getContent(), msg.getCreatedAt());
	}

	private void assertMember(UUID conversationId, UUID userId) {
		if (!memberRepository.existsById(new ConversationMemberId(conversationId, userId))) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès à la conversation refusé.");
		}
	}
}
