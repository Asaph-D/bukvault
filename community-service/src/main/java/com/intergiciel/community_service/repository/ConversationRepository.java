package com.intergiciel.community_service.repository;

import com.intergiciel.community_service.domain.ConversationEntity;
import com.intergiciel.community_service.domain.ConversationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<ConversationEntity, UUID> {

	@Query("""
			select c.id from ConversationEntity c
			where c.type = :directType
			and c.id in (select m.id.conversationId from ConversationMemberEntity m where m.id.userId = :a)
			and c.id in (select m.id.conversationId from ConversationMemberEntity m where m.id.userId = :b)
			""")
	List<UUID> findDirectBetween(@Param("a") UUID a, @Param("b") UUID b, @Param("directType") ConversationType directType);
}
