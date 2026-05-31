package com.intergiciel.order_service.support;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Calculs panier / commande — alignés sur le front Angular (XAF). */
public final class OrderPricing {

	public static final BigDecimal SHIPPING_FEE_XAF = new BigDecimal("3000");
	public static final BigDecimal TAX_RATE = new BigDecimal("0.20");
	public static final String CURRENCY = "XAF";

	private OrderPricing() {
	}

	public static BigDecimal shippingFee(BigDecimal subtotal) {
		return subtotal.compareTo(BigDecimal.ZERO) > 0 ? SHIPPING_FEE_XAF : BigDecimal.ZERO;
	}

	public static BigDecimal taxAmount(BigDecimal subtotal) {
		if (subtotal.compareTo(BigDecimal.ZERO) <= 0) {
			return BigDecimal.ZERO;
		}
		return subtotal.multiply(TAX_RATE).setScale(0, RoundingMode.HALF_UP);
	}

	/** Sous-total + livraison + taxes (arrondi entier XAF). */
	public static BigDecimal checkoutTotal(BigDecimal subtotal) {
		if (subtotal.compareTo(BigDecimal.ZERO) <= 0) {
			return BigDecimal.ZERO;
		}
		return subtotal
				.add(shippingFee(subtotal))
				.add(taxAmount(subtotal))
				.setScale(0, RoundingMode.HALF_UP);
	}

	public static int toXafInt(BigDecimal amount) {
		if (amount == null) {
			return 0;
		}
		return amount.setScale(0, RoundingMode.HALF_UP).intValueExact();
	}
}
