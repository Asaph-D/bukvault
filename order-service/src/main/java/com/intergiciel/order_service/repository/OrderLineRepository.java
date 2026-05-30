package com.intergiciel.order_service.repository;

import com.intergiciel.order_service.domain.OrderLineEntity;
import com.intergiciel.order_service.domain.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
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

	@Query("""
			select coalesce(sum(ol.quantity), 0)
			from OrderLineEntity ol
			join ol.order ord
			where ol.bookId in :bookIds
			  and ord.status in :paidStatuses
			""")
	long sumQuantityForBooks(@Param("bookIds") Collection<UUID> bookIds,
			@Param("paidStatuses") Collection<OrderStatus> paidStatuses);

	@Query("""
			select coalesce(sum(ol.unitPrice * ol.quantity), 0)
			from OrderLineEntity ol
			join ol.order ord
			where ol.bookId in :bookIds
			  and ord.status in :paidStatuses
			""")
	BigDecimal sumRevenueForBooks(@Param("bookIds") Collection<UUID> bookIds,
			@Param("paidStatuses") Collection<OrderStatus> paidStatuses);

	@Query("""
			select ol.bookId as bookId, max(ord.createdAt) as purchasedAt, max(ord.id) as orderId
			from OrderLineEntity ol
			join ol.order ord
			where ord.userId = :userId
			  and ord.status in :paidStatuses
			group by ol.bookId
			order by max(ord.createdAt) desc
			""")
	List<PurchasedBookProjection> findPurchasedBooksByUser(@Param("userId") UUID userId,
			@Param("paidStatuses") Collection<OrderStatus> paidStatuses);
}
