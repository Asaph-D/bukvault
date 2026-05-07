package com.intergiciel.catalog_service.repository;

import com.intergiciel.catalog_service.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

	Optional<Category> findBySlug(String slug);

	boolean existsBySlug(String slug);

	boolean existsBySlugAndIdNot(String slug, UUID id);

	List<Category> findAllByOrderByDisplayOrderAscNameAsc();

	List<Category> findByParent_IdOrderByDisplayOrderAsc(UUID parentId);

	@Query("select count(distinct b.id) from Book b join b.categories c where c.id = :categoryId and b.deleted = false")
	long countBooksLinked(@Param("categoryId") UUID categoryId);
}
