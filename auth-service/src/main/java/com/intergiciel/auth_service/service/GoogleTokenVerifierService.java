package com.intergiciel.auth_service.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.intergiciel.auth_service.config.AppProperties;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class GoogleTokenVerifierService {

	private final GoogleIdTokenVerifier verifier;

	private final String clientId;

	public GoogleTokenVerifierService(AppProperties appProperties) {
		this.clientId = appProperties.getGoogle().getClientId() != null
				? appProperties.getGoogle().getClientId().trim()
				: "";
		this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
				.setAudience(Collections.singletonList(this.clientId))
				.build();
	}

	public boolean isConfigured() {
		return clientId != null && !clientId.isBlank();
	}

	public GoogleProfile verify(String idTokenRaw) {
		if (!isConfigured()) {
			throw new GoogleAuthException("Connexion Google non configurée (GOOGLE_CLIENT_ID manquant).");
		}
		if (idTokenRaw == null || idTokenRaw.isBlank()) {
			throw new GoogleAuthException("Jeton Google manquant.");
		}
		try {
			GoogleIdToken idToken = verifier.verify(idTokenRaw);
			if (idToken == null) {
				throw new GoogleAuthException("Jeton Google invalide ou expiré.");
			}
			GoogleIdToken.Payload payload = idToken.getPayload();
			String sub = payload.getSubject();
			String email = payload.getEmail();
			if (sub == null || sub.isBlank() || email == null || email.isBlank()) {
				throw new GoogleAuthException("Profil Google incomplet (e-mail requis).");
			}
			Boolean emailVerified = payload.getEmailVerified();
			if (emailVerified == null || !emailVerified) {
				throw new GoogleAuthException("L’adresse Google n’est pas vérifiée.");
			}
			String given = payload.get("given_name") != null ? payload.get("given_name").toString() : "";
			String family = payload.get("family_name") != null ? payload.get("family_name").toString() : "";
			String name = payload.get("name") != null ? payload.get("name").toString() : "";
			if (given.isBlank() && !name.isBlank()) {
				String[] parts = name.trim().split("\\s+", 2);
				given = parts[0];
				family = parts.length > 1 ? parts[1] : "";
			}
			if (given.isBlank()) {
				given = email.substring(0, email.indexOf('@') > 0 ? email.indexOf('@') : email.length());
			}
			if (family.isBlank()) {
				family = "—";
			}
			return new GoogleProfile(sub, email.trim().toLowerCase(), given.trim(), family.trim());
		}
		catch (GoogleAuthException ex) {
			throw ex;
		}
		catch (Exception ex) {
			throw new GoogleAuthException("Impossible de valider le jeton Google.");
		}
	}

	public record GoogleProfile(String sub, String email, String firstName, String lastName) {
	}
}
