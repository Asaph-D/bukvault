package com.intergiciel.auth_service.config;

import com.intergiciel.auth_service.domain.AuthProvider;
import com.intergiciel.auth_service.domain.AuthUser;
import com.intergiciel.auth_service.repository.AuthUserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Comptes créés avant Google / vérification e-mail : considérés comme vérifiés (mot de passe local).
 */
@Component
public class AuthLegacyMigration implements ApplicationRunner {

	private final AuthUserRepository authUserRepository;

	public AuthLegacyMigration(AuthUserRepository authUserRepository) {
		this.authUserRepository = authUserRepository;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		for (AuthUser user : authUserRepository.findAll()) {
			boolean changed = false;
			if (user.getAuthProvider() == null) {
				user.setAuthProvider(AuthProvider.LOCAL);
				changed = true;
			}
			if (!user.isEmailVerified()
					&& user.getAuthProvider() == AuthProvider.LOCAL
					&& user.getEmailVerificationToken() == null
					&& user.getPasswordHash() != null
					&& !user.getPasswordHash().isBlank()) {
				user.setEmailVerified(true);
				changed = true;
			}
			if (changed) {
				authUserRepository.save(user);
			}
		}
	}
}
