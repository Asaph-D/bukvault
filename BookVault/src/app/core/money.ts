/** Devise unique de la plateforme (Cameroun). */
export const APP_CURRENCY = 'XAF';

/** Frais de livraison indicatifs lorsque le panier contient des articles. */
export const SHIPPING_FEE_XAF = 3_000;

/** Format Angular CurrencyPipe : XAF sans décimales. */
export const XAF_CURRENCY_PIPE = `${APP_CURRENCY}:symbol-narrow:1.0-0` as const;

export function formatXaf(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) {
    return '—';
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: APP_CURRENCY,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Frais de livraison : 0 si panier vide. */
export function shippingFeeXaf(cartItemCount: number): number {
  return cartItemCount > 0 ? SHIPPING_FEE_XAF : 0;
}
