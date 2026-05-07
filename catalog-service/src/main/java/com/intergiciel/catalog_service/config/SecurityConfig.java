package com.intergiciel.catalog_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

	/**
	 * Profil test : pas de JWT (compatibilité tests @SpringBootTest).
	 */
	@Bean
	@Order(1)
	@Profile("test")
	SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
		http.csrf(csrf -> csrf.disable());
		http.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
		http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
		return http.build();
	}

	/**
	 * Lectures publiques et docs : aucun filtre OAuth2 — un Bearer invalide n’est pas évalué (plus de 401 sur GET catalogue).
	 */
	@Bean
	@Order(1)
	@Profile("!test")
	SecurityFilterChain publicReadSecurityFilterChain(HttpSecurity http) throws Exception {
		http.securityMatcher(new OrRequestMatcher(
				PathPatternRequestMatcher.pathPattern(HttpMethod.GET, "/api/v1/books/**"),
				PathPatternRequestMatcher.pathPattern(HttpMethod.GET, "/api/v1/categories/**"),
				PathPatternRequestMatcher.pathPattern("/actuator/health"),
				PathPatternRequestMatcher.pathPattern("/v3/api-docs/**"),
				PathPatternRequestMatcher.pathPattern("/swagger-ui/**"),
				PathPatternRequestMatcher.pathPattern("/swagger-ui.html"),
				PathPatternRequestMatcher.pathPattern("/error")));
		http.csrf(csrf -> csrf.disable());
		http.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
		http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
		return http.build();
	}

	/**
	 * Écritures catalogue + tout le reste : JWT obligatoire.
	 */
	@Bean
	@Order(2)
	@Profile("!test")
	SecurityFilterChain jwtSecurityFilterChain(HttpSecurity http,
			JwtAuthenticationConverter jwtAuthenticationConverter) throws Exception {
		http.securityMatcher(PathPatternRequestMatcher.pathPattern("/**"));
		http.csrf(csrf -> csrf.disable());
		http.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
		http.authorizeHttpRequests(auth -> auth
				.requestMatchers(HttpMethod.POST, "/api/v1/categories/**").hasRole("ADMIN")
				.requestMatchers(HttpMethod.PUT, "/api/v1/categories/**").hasRole("ADMIN")
				.requestMatchers(HttpMethod.DELETE, "/api/v1/categories/**").hasRole("ADMIN")
				.anyRequest()
				.authenticated());
		http.oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter)));
		return http.build();
	}

	@Bean
	JwtDecoder jwtDecoder(@Value("${spring.security.oauth2.resourceserver.jwt.secret-key}") String secret) {
		var key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
		return NimbusJwtDecoder.withSecretKey(key).build();
	}

	@Bean
	JwtAuthenticationConverter jwtAuthenticationConverter() {
		JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
		converter.setJwtGrantedAuthoritiesConverter(jwt -> {
			String role = jwt.getClaimAsString("role");
			if (role == null || role.isBlank()) {
				return Collections.emptyList();
			}
			return List.of(new SimpleGrantedAuthority("ROLE_" + role));
		});
		return converter;
	}
}
