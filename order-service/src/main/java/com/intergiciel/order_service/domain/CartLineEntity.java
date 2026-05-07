package com.intergiciel.order_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "cart_line", uniqueConstraints = {
		@UniqueConstraint(name = "uk_cart_user_book", columnNames = { "user_id", "book_id" })
})
public class CartLineEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, updatable = false)
	private UUID userId;

	@Column(nullable = false, updatable = false)
	private UUID bookId;

	@Column(nullable = false)
	private int quantity = 1;

	@Column(nullable = false, precision = 19, scale = 4)
	private BigDecimal unitPrice;

	@Column(nullable = false, length = 32)
	private String format = "EBOOK";

	protected CartLineEntity() {
	}

	public CartLineEntity(UUID userId, UUID bookId, int quantity, BigDecimal unitPrice, String format) {
		this.userId = userId;
		this.bookId = bookId;
		this.quantity = quantity;
		this.unitPrice = unitPrice;
		this.format = format;
	}

	public Long getId() {
		return id;
	}

	public UUID getUserId() {
		return userId;
	}

	public UUID getBookId() {
		return bookId;
	}

	public int getQuantity() {
		return quantity;
	}

	public void setQuantity(int quantity) {
		this.quantity = quantity;
	}

	public BigDecimal getUnitPrice() {
		return unitPrice;
	}

	public void setUnitPrice(BigDecimal unitPrice) {
		this.unitPrice = unitPrice;
	}

	public String getFormat() {
		return format;
	}

	public void setFormat(String format) {
		this.format = format;
	}
}
