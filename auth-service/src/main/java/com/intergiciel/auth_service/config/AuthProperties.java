package com.intergiciel.auth_service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "auth")
public class AuthProperties {

	private Jwt jwt = new Jwt();

	public Jwt getJwt() {
		return jwt;
	}

	public void setJwt(Jwt jwt) {
		this.jwt = jwt;
	}

	public static class Jwt {

		private String secret = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

		private long accessTokenMinutes = 15;

		private long refreshTokenDays = 7;

		/** Durée refresh token si “remember me”. */
		private long refreshTokenDaysRememberMe = 30;

		public String getSecret() {
			return secret;
		}

		public void setSecret(String secret) {
			this.secret = secret;
		}

		public long getAccessTokenMinutes() {
			return accessTokenMinutes;
		}

		public void setAccessTokenMinutes(long accessTokenMinutes) {
			this.accessTokenMinutes = accessTokenMinutes;
		}

		public long getRefreshTokenDays() {
			return refreshTokenDays;
		}

		public void setRefreshTokenDays(long refreshTokenDays) {
			this.refreshTokenDays = refreshTokenDays;
		}

		public long getRefreshTokenDaysRememberMe() {
			return refreshTokenDaysRememberMe;
		}

		public void setRefreshTokenDaysRememberMe(long refreshTokenDaysRememberMe) {
			this.refreshTokenDaysRememberMe = refreshTokenDaysRememberMe;
		}
	}
}
