package com.intergiciel.order_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "order_line")
public class OrderLineEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "order_id", nullable = false)
	private OrderEntity order;

	@Column(nullable = false, updatable = false)
	private UUID bookId;

	@Column(nullable = false)
	private int quantity;

	@Column(nullable = false, precision = 19, scale = 4)
	private BigDecimal unitPrice;

	@Column(nullable = false, length = 32)
	private String format = "EBOOK";

	protected OrderLineEntity() {
	}

	public OrderLineEntity(UUID bookId, int quantity, BigDecimal unitPrice, String format) {
		this.bookId = bookId;
		this.quantity = quantity;
		this.unitPrice = unitPrice;
		this.format = format;
	}

	public void setOrder(OrderEntity order) {
		this.order = order;
	}

	public Long getId() {
		return id;
	}

	public OrderEntity getOrder() {
		return order;
	}

	public UUID getBookId() {
		return bookId;
	}

	public int getQuantity() {
		return quantity;
	}

	public BigDecimal getUnitPrice() {
		return unitPrice;
	}

	public String getFormat() {
		return format;
	}
}
