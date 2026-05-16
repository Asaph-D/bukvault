package com.intergiciel.reading_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http, Environment environment) throws Exception {
		boolean testProfile = Arrays.asList(environment.getActiveProfiles()).contains("test");
		http.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
		http.csrf(csrf -> csrf.disable());
		if (testProfile) {
			http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
		}
		else {
			http.authorizeHttpRequests(auth -> auth
					.requestMatchers(
							"/actuator/health",
							"/actuator/info",
							"/v3/api-docs/**",
							"/swagger-ui.html",
							"/swagger-ui/**")
					.permitAll()
					.anyRequest()
					.authenticated());
			http.oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
		}
		return http.build();
	}

	@Bean
	JwtDecoder jwtDecoder(@Value("${spring.security.oauth2.resourceserver.jwt.secret-key}") String secret) {
		var key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
		return NimbusJwtDecoder.withSecretKey(key).build();
	}
}
