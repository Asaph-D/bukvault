package com.intergiciel.community_service.repository;

import com.intergiciel.community_service.domain.HubStatEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HubStatRepository extends JpaRepository<HubStatEntity, Short> {
}
