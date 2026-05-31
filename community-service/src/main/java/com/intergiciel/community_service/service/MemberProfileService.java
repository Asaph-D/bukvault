package com.intergiciel.community_service.service;

import com.intergiciel.community_service.config.CommunityProperties;
import com.intergiciel.community_service.domain.MemberProfileEntity;
import com.intergiciel.community_service.repository.MemberProfileRepository;
import com.intergiciel.community_service.web.dto.MemberSnapshot;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class MemberProfileService {

	private final MemberProfileRepository memberProfileRepository;
	private final CommunityProperties communityProperties;

	public MemberProfileService(MemberProfileRepository memberProfileRepository, CommunityProperties communityProperties) {
		this.memberProfileRepository = memberProfileRepository;
		this.communityProperties = communityProperties;
	}

	@Transactional(readOnly = true)
	public MemberSnapshot snapshot(UUID userId) {
		return memberProfileRepository.findById(userId)
				.map(this::toSnapshot)
				.orElse(fallbackSnapshot(userId));
	}

	@Transactional
	public MemberSnapshot ensureFromJwt(JwtAuthenticationToken jwt) {
		UUID userId = UUID.fromString(jwt.getName());
		String email = claim(jwt, "email");
		String firstName = claim(jwt, "firstName");
		String lastName = claim(jwt, "lastName");
		String role = claim(jwt, "role");
		if (email == null || email.isBlank()) {
			email = userId + "@bookvault.local";
		}
		if (firstName == null) {
			firstName = "Lecteur";
		}
		if (lastName == null) {
			lastName = "";
		}
		if (role == null || role.isBlank()) {
			role = "READER";
		}
		MemberProfileEntity profile = memberProfileRepository.findById(userId).orElseGet(MemberProfileEntity::new);
		profile.setUserId(userId);
		profile.setEmail(email);
		profile.setFirstName(firstName);
		profile.setLastName(lastName);
		profile.setRole(role);
		if (profile.getBio() == null) {
			profile.setBio("");
		}
		profile.setActive(true);
		profile.setUpdatedAt(Instant.now());
		memberProfileRepository.save(profile);
		return toSnapshot(profile);
	}

	public String resolveAvatarUrl(UUID userId, String stored) {
		if (stored != null && !stored.isBlank()) {
			return stored;
		}
		String base = communityProperties.getApiPublicBaseUrl().replaceAll("/+$", "");
		return base + "/api/v1/files/avatar/" + userId;
	}

	private MemberSnapshot toSnapshot(MemberProfileEntity m) {
		String display = (m.getFirstName() + " " + m.getLastName()).trim();
		if (display.isBlank()) {
			display = m.getEmail();
		}
		return new MemberSnapshot(
				m.getUserId(),
				m.getEmail(),
				display,
				resolveAvatarUrl(m.getUserId(), m.getAvatarUrl()));
	}

	private MemberSnapshot fallbackSnapshot(UUID userId) {
		return new MemberSnapshot(
				userId,
				userId + "@bookvault.local",
				"Membre " + userId.toString().substring(0, 8),
				resolveAvatarUrl(userId, null));
	}

	private static String claim(JwtAuthenticationToken jwt, String name) {
		return jwt.getToken().getClaimAsString(name);
	}
}
