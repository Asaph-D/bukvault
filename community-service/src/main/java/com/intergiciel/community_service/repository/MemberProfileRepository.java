package com.intergiciel.community_service.repository;

import com.intergiciel.community_service.domain.MemberProfileEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface MemberProfileRepository extends JpaRepository<MemberProfileEntity, UUID> {

	@Query("""
			select m from MemberProfileEntity m
			where m.active = true
			  and (
			    lower(m.email) like lower(concat('%', :q, '%'))
			    or lower(m.firstName) like lower(concat('%', :q, '%'))
			    or lower(m.lastName) like lower(concat('%', :q, '%'))
			  )
			order by m.lastName asc, m.firstName asc
			""")
	List<MemberProfileEntity> search(@Param("q") String q, Pageable pageable);
}

