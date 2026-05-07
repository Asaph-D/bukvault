package com.intergiciel.user_service.repository;

import com.intergiciel.user_service.domain.Role;
import com.intergiciel.user_service.domain.UserProfile;
import org.springframework.data.jpa.domain.Specification;

public final class UserProfileSpecifications {

	private UserProfileSpecifications() {
	}

	public static Specification<UserProfile> hasRole(Role role) {
		return (root, q, cb) -> role == null ? cb.conjunction() : cb.equal(root.get("role"), role);
	}

	public static Specification<UserProfile> hasActive(Boolean active) {
		return (root, q, cb) -> active == null ? cb.conjunction() : cb.equal(root.get("active"), active);
	}
}
