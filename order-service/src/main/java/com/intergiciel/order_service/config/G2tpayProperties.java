package com.intergiciel.order_service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.math.BigDecimal;

@ConfigurationProperties(prefix = "order.g2tpay")
public class G2tpayProperties {

	private boolean enabled = false;
	private String apiKey = "";
	private String baseUrl = "https://g2tpay.net";
	/** URL publique du webhook (gateway), ex. https://xxx.ngrok.io/api/v1/orders/webhook/g2tpay */
	private String webhookUrl = "";
	/** URL publique de l'api-gateway (sans slash final), ex. https://api.example.com ou tunnel ngrok. */
	private String gatewayPublicUrl = "";
	private BigDecimal eurToXafRate = new BigDecimal("655.957");
	/** Valeurs operator G2TPay — à copier depuis votre page SDK (Clés API → SDK). */
	private String operatorMtn = "MTN_CMR";
	private String operatorOrange = "ORANGE_CMR";

	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public String getApiKey() {
		return apiKey;
	}

	public void setApiKey(String apiKey) {
		this.apiKey = apiKey;
	}

	public String getBaseUrl() {
		return baseUrl;
	}

	public void setBaseUrl(String baseUrl) {
		this.baseUrl = baseUrl;
	}

	public String getWebhookUrl() {
		return webhookUrl;
	}

	public void setWebhookUrl(String webhookUrl) {
		this.webhookUrl = webhookUrl;
	}

	public String getGatewayPublicUrl() {
		return gatewayPublicUrl;
	}

	public void setGatewayPublicUrl(String gatewayPublicUrl) {
		this.gatewayPublicUrl = gatewayPublicUrl;
	}

	/** URL callback G2TPay effective (webhook explicite ou dérivée de la gateway publique). */
	public String effectiveWebhookUrl() {
		if (webhookUrl != null && !webhookUrl.isBlank()) {
			return webhookUrl.trim();
		}
		if (gatewayPublicUrl != null && !gatewayPublicUrl.isBlank()) {
			String base = gatewayPublicUrl.trim();
			if (base.endsWith("/")) {
				base = base.substring(0, base.length() - 1);
			}
			return base + "/api/v1/orders/webhook/g2tpay";
		}
		return "";
	}

	public BigDecimal getEurToXafRate() {
		return eurToXafRate;
	}

	public void setEurToXafRate(BigDecimal eurToXafRate) {
		this.eurToXafRate = eurToXafRate;
	}

	public String getOperatorMtn() {
		return operatorMtn;
	}

	public void setOperatorMtn(String operatorMtn) {
		this.operatorMtn = operatorMtn;
	}

	public String getOperatorOrange() {
		return operatorOrange;
	}

	public void setOperatorOrange(String operatorOrange) {
		this.operatorOrange = operatorOrange;
	}

	public String resolveOperator(com.intergiciel.order_service.domain.MobileMoneyOperator operator) {
		return switch (operator) {
			case MTN -> operatorMtn;
			case ORANGE -> operatorOrange;
		};
	}
}
