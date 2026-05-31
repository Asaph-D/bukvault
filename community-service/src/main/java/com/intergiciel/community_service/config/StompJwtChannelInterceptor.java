package com.intergiciel.community_service.config;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class StompJwtChannelInterceptor implements ChannelInterceptor {

	private final JwtDecoder jwtDecoder;

	public StompJwtChannelInterceptor(JwtDecoder jwtDecoder) {
		this.jwtDecoder = jwtDecoder;
	}

	@Override
	public Message<?> preSend(Message<?> message, MessageChannel channel) {
		StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
		if (accessor == null) {
			return message;
		}
		if (StompCommand.CONNECT.equals(accessor.getCommand())) {
			String raw = firstHeader(accessor, "Authorization");
			if (raw == null) {
				raw = firstHeader(accessor, "authorization");
			}
			if (raw != null && raw.startsWith("Bearer ")) {
				String token = raw.substring(7).trim();
				Jwt jwt = jwtDecoder.decode(token);
				JwtAuthenticationToken auth = new JwtAuthenticationToken(jwt, List.of());
				accessor.setUser(auth);
				accessor.setLeaveMutable(true);
			}
		}
		return message;
	}

	private static String firstHeader(StompHeaderAccessor accessor, String name) {
		List<String> values = accessor.getNativeHeader(name);
		if (values == null || values.isEmpty()) {
			return null;
		}
		return values.get(0);
	}
}
