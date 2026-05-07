package com.intergiciel.order_service.repository;

import com.intergiciel.order_service.domain.OrderLineEntity;
import com.intergiciel.order_service.domain.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface OrderLineRepository extends JpaRepository<OrderLineEntity, Long> {

	@Query("""
			select case when count(ol) > 0 then true else false end
			from OrderLineEntity ol
			join ol.order ord
			where ord.userId = :userId
			  and ol.bookId = :bookId
			  and ord.status in (:paidStatuses)
			""")
	boolean existsPaidPurchase(@Param("userId") UUID userId,
			@Param("bookId") UUID bookId,
			@Param("paidStatuses") java.util.Collection<OrderStatus> paidStatuses);
}
