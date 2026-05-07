package com.intergiciel.community_service.domain;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "conversation_member")
public class ConversationMemberEntity {

	@EmbeddedId
	private ConversationMemberId id;

	protected ConversationMemberEntity() {
	}

	public ConversationMemberEntity(UUID conversationId, UUID userId) {
		this.id = new ConversationMemberId(conversationId, userId);
	}

	public ConversationMemberId getId() {
		return id;
	}

	public void setId(ConversationMemberId id) {
		this.id = id;
	}
}
