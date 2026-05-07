package com.intergiciel.community_service.repository;

import com.intergiciel.community_service.domain.ChatMessageEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessageEntity, UUID> {

	Page<ChatMessageEntity> findByConversationIdOrderByCreatedAtDesc(UUID conversationId, Pageable pageable);

	Page<ChatMessageEntity> findByConversationIdOrderByCreatedAtAsc(UUID conversationId, Pageable pageable);
}
