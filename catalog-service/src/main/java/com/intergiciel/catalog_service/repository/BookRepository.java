package com.intergiciel.catalog_service.repository;

import com.intergiciel.catalog_service.domain.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface BookRepository extends JpaRepository<Book, UUID>, JpaSpecificationExecutor<Book> {

	boolean existsByIsbn(String isbn);

	boolean existsByIsbnAndIdNot(String isbn, UUID id);

	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query("update Book b set b.viewCount = b.viewCount + 1 where b.id = :id")
	int incrementViewCount(@Param("id") UUID id);
}
