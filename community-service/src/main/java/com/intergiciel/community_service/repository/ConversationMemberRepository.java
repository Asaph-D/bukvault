package com.intergiciel.community_service.repository;

import com.intergiciel.community_service.domain.ConversationMemberEntity;
import com.intergiciel.community_service.domain.ConversationMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationMemberRepository extends JpaRepository<ConversationMemberEntity, ConversationMemberId> {

	List<ConversationMemberEntity> findById_UserIdOrderById_ConversationId(UUID userId);

	@Query("select m from ConversationMemberEntity m where m.id.conversationId = :cid and m.id.userId <> :uid")
	List<ConversationMemberEntity> findOthersInConversation(@Param("cid") UUID conversationId, @Param("uid") UUID userId);
}
