package com.intergiciel.community_service.repository;

import com.intergiciel.community_service.domain.BookLikeEntity;
import com.intergiciel.community_service.domain.BookLikeId;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface BookLikeRepository extends JpaRepository<BookLikeEntity, BookLikeId> {

	@Query("select bl.id.bookId from BookLikeEntity bl where bl.id.userId = :userId order by bl.likedAt desc")
	List<UUID> findBookIdsByUserId(@Param("userId") UUID userId, Pageable pageable);

	@Query("select distinct bl.id.userId from BookLikeEntity bl where bl.id.bookId = :bookId")
	List<UUID> findUserIdsWhoLikedBook(@Param("bookId") UUID bookId);

	@Query("""
			select other.id.userId
			from BookLikeEntity other
			where other.id.bookId in (
			  select mine.id.bookId from BookLikeEntity mine where mine.id.userId = :userId
			)
			and other.id.userId <> :userId
			group by other.id.userId
			order by count(other.id.bookId) desc, max(other.likedAt) desc
			""")
	List<UUID> recommendBuddies(@Param("userId") UUID userId, Pageable pageable);
}

