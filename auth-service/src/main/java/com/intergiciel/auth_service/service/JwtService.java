package com.intergiciel.auth_service.service;

import com.intergiciel.auth_service.config.AuthProperties;
import com.intergiciel.auth_service.domain.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

	private final AuthProperties authProperties;
	private final SecretKey secretKey;

	public JwtService(AuthProperties authProperties) {
		this.authProperties = authProperties;
		byte[] keyBytes = authProperties.getJwt().getSecret().getBytes(StandardCharsets.UTF_8);
		this.secretKey = Keys.hmacShaKeyFor(keyBytes);
	}

	public String createAccessToken(UUID userId, String email, String firstName, String lastName, Role role) {
		Instant now = Instant.now();
		Instant exp = now.plusSeconds(authProperties.getJwt().getAccessTokenMinutes() * 60);
		String jti = UUID.randomUUID().toString();
		// Algorithme explicite HS256 : avec une clé longue, signWith(secretKey) choisit HS512,
		// alors que les resource servers (Nimbus + SecretKeySpec HmacSHA256) attendent HS256 → 401.
		return Jwts.builder()
				.id(jti)
				.subject(userId.toString())
				.claim("email", email)
				.claim("firstName", firstName)
				.claim("lastName", lastName)
				.claim("role", role.name())
				.issuedAt(Date.from(now))
				.expiration(Date.from(exp))
				.signWith(secretKey, Jwts.SIG.HS256)
				.compact();
	}

	public Claims parseAccessToken(String token) {
		return Jwts.parser()
				.verifyWith(secretKey)
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}

	public void validateAccessToken(String token) {
		try {
			parseAccessToken(token);
		}
		catch (JwtException | IllegalArgumentException e) {
			throw new InvalidTokenException("Token d'accès invalide ou expiré.");
		}
	}
}
