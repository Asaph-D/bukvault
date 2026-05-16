package com.intergiciel.catalog_service.repository;

import com.intergiciel.catalog_service.domain.Book;
import com.intergiciel.catalog_service.domain.BookStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface BookRepository extends JpaRepository<Book, UUID>, JpaSpecificationExecutor<Book> {

	boolean existsByIsbn(String isbn);

	boolean existsByIsbnAndIdNot(String isbn, UUID id);

	long countByDeletedFalseAndStatus(BookStatus status);

	long countByDeletedFalseAndStatusAndPublishedAtGreaterThanEqual(BookStatus status, Instant since);

	long countByDeletedFalseAndStatusAndPublishedAtGreaterThanEqualAndPublishedAtLessThan(
			BookStatus status, Instant startInclusive, Instant endExclusive);

	@Query("select coalesce(sum(b.viewCount), 0) from Book b where b.deleted = false and b.status = com.intergiciel.catalog_service.domain.BookStatus.PUBLISHED")
	long sumViewCountPublished();

	@Query("""
			select coalesce(sum(b.viewCount), 0) from Book b
			where b.deleted = false and b.status = com.intergiciel.catalog_service.domain.BookStatus.PUBLISHED
			and b.updatedAt >= :since
			""")
	long sumViewCountPublishedUpdatedSince(@Param("since") Instant since);

	@Query("""
			select coalesce(sum(b.viewCount), 0) from Book b
			where b.deleted = false and b.status = com.intergiciel.catalog_service.domain.BookStatus.PUBLISHED
			and b.updatedAt >= :start and b.updatedAt < :end
			""")
	long sumViewCountPublishedUpdatedBetween(@Param("start") Instant start, @Param("end") Instant end);

	@Query("""
			select c.name, coalesce(sum(b.viewCount), 0)
			from Book b join b.categories c
			where b.deleted = false and b.status = com.intergiciel.catalog_service.domain.BookStatus.PUBLISHED
			group by c.id, c.name
			order by 2 desc
			""")
	List<Object[]> sumViewsByCategoryPublished();

	@Query("""
			select b.authorUserId, coalesce(sum(b.viewCount), 0)
			from Book b
			where b.deleted = false and b.status = com.intergiciel.catalog_service.domain.BookStatus.PUBLISHED
			group by b.authorUserId
			order by 2 desc
			""")
	List<Object[]> topAuthorsByViews(org.springframework.data.domain.Pageable pageable);

	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query("update Book b set b.viewCount = b.viewCount + 1 where b.id = :id")
	int incrementViewCount(@Param("id") UUID id);
}
