package com.intergiciel.user_service.service;

import com.intergiciel.user_service.domain.Role;
import com.intergiciel.user_service.domain.UserProfile;
import com.intergiciel.user_service.repository.UserProfileRepository;
import com.intergiciel.user_service.repository.UserProfileSpecifications;
import com.intergiciel.user_service.web.dto.LibraryItemResponse;
import com.intergiciel.user_service.web.dto.OrderSummaryResponse;
import com.intergiciel.user_service.web.dto.UpdateRoleRequest;
import com.intergiciel.user_service.web.dto.UpdateUserRequest;
import com.intergiciel.user_service.web.dto.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class UserProfileService {

	private final UserProfileRepository userProfileRepository;
	private final ReaderSettingsService readerSettingsService;

	public UserProfileService(
			UserProfileRepository userProfileRepository,
			ReaderSettingsService readerSettingsService) {
		this.userProfileRepository = userProfileRepository;
		this.readerSettingsService = readerSettingsService;
	}

	@Transactional
	public UserResponse bootstrap(Jwt jwt) {
		UUID userId = UUID.fromString(jwt.getSubject());
		UserResponse res = userProfileRepository.findById(userId)
				.map(this::toResponse)
				.orElseGet(() -> createFromJwt(jwt, userId));
		readerSettingsService.ensureDefaults(userId);
		return res;
	}

	private UserResponse createFromJwt(Jwt jwt, UUID userId) {
		String email = jwt.getClaimAsString("email");
		String firstName = jwt.getClaimAsString("firstName");
		String lastName = jwt.getClaimAsString("lastName");
		Role role = Role.valueOf(jwt.getClaimAsString("role"));
		Instant now = Instant.now();
		UserProfile p = UserProfile.builder()
				.userId(userId)
				.email(email != null ? email : "")
				.firstName(firstName != null ? firstName : "")
				.lastName(lastName != null ? lastName : "")
				.role(role)
				.active(true)
				.bio(null)
				.avatarUrl(null)
				.preferredLanguage("fr")
				.newsletter(false)
				.createdAt(now)
				.updatedAt(now)
				.build();
		return toResponse(userProfileRepository.save(p));
	}

	@Transactional(readOnly = true)
	public Page<UserResponse> listAll(Role roleFilter, Boolean activeFilter, Pageable pageable) {
		Specification<UserProfile> spec = Specification
				.where(UserProfileSpecifications.hasRole(roleFilter))
				.and(UserProfileSpecifications.hasActive(activeFilter));
		return userProfileRepository.findAll(spec, pageable).map(this::toResponse);
	}

	@Transactional(readOnly = true)
	public UserResponse getById(UUID id, Jwt jwt) {
		requireSelfOrAdmin(id, jwt);
		UserProfile u = userProfileRepository.findById(id)
				.orElseThrow(() -> new UserNotFoundException("Utilisateur introuvable."));
		return toResponse(u);
	}

	@Transactional
	public UserResponse update(UUID id, UpdateUserRequest request, Jwt jwt) {
		requireSelfOrAdmin(id, jwt);
		UserProfile u = userProfileRepository.findById(id)
				.orElseThrow(() -> new UserNotFoundException("Utilisateur introuvable."));
		u.setFirstName(request.firstName().trim());
		u.setLastName(request.lastName().trim());
		u.setBio(request.bio());
		u.setAvatarUrl(request.avatarUrl());
		if (request.preferredLanguage() != null) {
			u.setPreferredLanguage(request.preferredLanguage().trim());
		}
		u.setNewsletter(request.newsletter());
		u.setUpdatedAt(Instant.now());
		return toResponse(userProfileRepository.save(u));
	}

	@Transactional
	public void deactivate(UUID id, Jwt jwt) {
		requireSelfOrAdmin(id, jwt);
		UserProfile u = userProfileRepository.findById(id)
				.orElseThrow(() -> new UserNotFoundException("Utilisateur introuvable."));
		u.setActive(false);
		u.setUpdatedAt(Instant.now());
		userProfileRepository.save(u);
	}

	@Transactional
	public UserResponse updateRole(UUID id, UpdateRoleRequest request) {
		UserProfile u = userProfileRepository.findById(id)
				.orElseThrow(() -> new UserNotFoundException("Utilisateur introuvable."));
		u.setRole(request.role());
		u.setUpdatedAt(Instant.now());
		return toResponse(userProfileRepository.save(u));
	}

	@Transactional(readOnly = true)
	public Page<OrderSummaryResponse> listOrdersPlaceholder(UUID userId, Jwt jwt, Pageable pageable) {
		requireSelfOrAdmin(userId, jwt);
		userProfileRepository.findById(userId)
				.orElseThrow(() -> new UserNotFoundException("Utilisateur introuvable."));
		return Page.empty(pageable);
	}

	@Transactional(readOnly = true)
	public Page<LibraryItemResponse> libraryPlaceholder(UUID userId, Jwt jwt, Pageable pageable) {
		requireSelfOrAdmin(userId, jwt);
		userProfileRepository.findById(userId)
				.orElseThrow(() -> new UserNotFoundException("Utilisateur introuvable."));
		return Page.empty(pageable);
	}

	private void requireSelfOrAdmin(UUID targetUserId, Jwt jwt) {
		UUID caller = UUID.fromString(jwt.getSubject());
		String role = jwt.getClaimAsString("role");
		boolean admin = "ADMIN".equals(role);
		if (!admin && !caller.equals(targetUserId)) {
			throw new ForbiddenAccessException("Accès réservé au propriétaire ou à un administrateur.");
		}
	}

	private UserResponse toResponse(UserProfile u) {
		return new UserResponse(
				u.getUserId(),
				u.getEmail(),
				u.getFirstName(),
				u.getLastName(),
				u.getRole(),
				u.isActive(),
				u.getBio(),
				u.getAvatarUrl(),
				u.getPreferredLanguage(),
				u.isNewsletter(),
				u.getCreatedAt(),
				u.getUpdatedAt());
	}
}
