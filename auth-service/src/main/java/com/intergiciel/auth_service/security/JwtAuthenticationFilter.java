package com.intergiciel.auth_service.security;

import com.intergiciel.auth_service.domain.Role;
import com.intergiciel.auth_service.repository.BlacklistedJtiRepository;
import com.intergiciel.auth_service.service.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private final JwtService jwtService;
	private final BlacklistedJtiRepository blacklistedJtiRepository;

	public JwtAuthenticationFilter(JwtService jwtService, BlacklistedJtiRepository blacklistedJtiRepository) {
		this.jwtService = jwtService;
		this.blacklistedJtiRepository = blacklistedJtiRepository;
	}

	@Override
	protected void doFilterInternal(
			@NonNull HttpServletRequest request,
			@NonNull HttpServletResponse response,
			@NonNull FilterChain filterChain) throws ServletException, IOException {
		String header = request.getHeader(HttpHeaders.AUTHORIZATION);
		if (header == null || !header.startsWith("Bearer ")) {
			filterChain.doFilter(request, response);
			return;
		}
		String token = header.substring(7).trim();
		try {
			Claims claims = jwtService.parseAccessToken(token);
			String jti = claims.getId();
			if (jti != null && blacklistedJtiRepository.existsById(jti)) {
				sendUnauthorized(response, "Token révoqué.");
				return;
			}
			UUID userId = UUID.fromString(claims.getSubject());
			String email = claims.get("email", String.class);
			Role role = Role.valueOf(claims.get("role", String.class));
			AuthUserPrincipal principal = new AuthUserPrincipal(userId, email, role);
			var auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
			SecurityContextHolder.getContext().setAuthentication(auth);
		}
		catch (JwtException | IllegalArgumentException e) {
			sendUnauthorized(response, "Token d'accès invalide ou expiré.");
			return;
		}
		filterChain.doFilter(request, response);
	}

	private static void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
		response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.setCharacterEncoding(StandardCharsets.UTF_8.name());
		response.getWriter().write("{\"title\":\"Unauthorized\",\"detail\":\"" + message.replace("\"", "'") + "\"}");
	}
}
