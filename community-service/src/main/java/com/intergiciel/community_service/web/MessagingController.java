package com.intergiciel.community_service.web;

import com.intergiciel.community_service.service.MessagingService;
import com.intergiciel.community_service.support.AuthSupport;
import com.intergiciel.community_service.web.dto.ChatMessageResponse;
import com.intergiciel.community_service.web.dto.ConversationSummaryResponse;
import com.intergiciel.community_service.web.dto.SendMessageRequest;
import com.intergiciel.community_service.web.dto.StartDirectRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/messaging")
@Tag(name = "Messagerie")
public class MessagingController {

	private final MessagingService messagingService;

	public MessagingController(MessagingService messagingService) {
		this.messagingService = messagingService;
	}

	@GetMapping("/conversations")
	@Operation(summary = "Liste des conversations")
	public List<ConversationSummaryResponse> list(Authentication authentication) {
		return messagingService.listConversations(AuthSupport.userId(authentication));
	}

	@PostMapping("/conversations")
	@Operation(summary = "Ouvrir ou retrouver une conversation directe")
	public ConversationSummaryResponse start(Authentication authentication,
			@Valid @RequestBody StartDirectRequest request) {
		return messagingService.startDirect(AuthSupport.userId(authentication), request.participantId());
	}

	@GetMapping("/conversations/{conversationId}/messages")
	@Operation(summary = "Messages d’une conversation")
	public Page<ChatMessageResponse> messages(Authentication authentication, @PathVariable UUID conversationId,
			@PageableDefault(size = 50) Pageable pageable) {
		return messagingService.messages(AuthSupport.userId(authentication), conversationId, pageable);
	}

	@PostMapping("/conversations/{conversationId}/messages")
	@Operation(summary = "Envoyer un message")
	public ChatMessageResponse send(Authentication authentication, @PathVariable UUID conversationId,
			@Valid @RequestBody SendMessageRequest request) {
		return messagingService.send(AuthSupport.userId(authentication), conversationId, request.content());
	}
}
