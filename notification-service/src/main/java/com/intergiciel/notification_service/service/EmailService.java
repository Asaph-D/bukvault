package com.intergiciel.notification_service.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

	private static final Logger log = LoggerFactory.getLogger(EmailService.class);

	private final JavaMailSender mailSender;
	private final String fromAddress;
	private final boolean enabled;

	public EmailService(
			JavaMailSender mailSender,
			@Value("${bookvault.mail.from}") String fromAddress,
			@Value("${bookvault.mail.enabled:true}") boolean enabled) {
		this.mailSender = mailSender;
		this.fromAddress = fromAddress;
		this.enabled = enabled;
	}

	public void sendBookPendingValidation(String to, String bookTitle, String authorLabel, String sheetUrl,
			String validationsUrl) {
		if (!enabled) {
			return;
		}
		if (to == null || to.isBlank()) {
			return;
		}
		try {
			SimpleMailMessage msg = new SimpleMailMessage();
			msg.setFrom(fromAddress);
			msg.setTo(to);
			msg.setSubject("BookVault — Nouveau manuscrit à valider : " + bookTitle);
			msg.setText("""
					Bonjour,

					Un nouveau manuscrit a été déposé et attend votre validation.

					Titre : %s
					Auteur : %s

					Fiche de publication :
					%s

					File de validations admin :
					%s

					L'équipe BookVault
					""".formatted(bookTitle, authorLabel, sheetUrl, validationsUrl));
			mailSender.send(msg);
			log.info("E-mail validation admin envoyé à {} pour « {} »", to, bookTitle);
		}
		catch (Exception ex) {
			log.error("Échec envoi e-mail validation admin à {} : {}", to, ex.getMessage());
		}
	}

	public void sendEmailVerification(String to, String firstName, String verifyUrl) {
		if (!enabled) {
			log.debug("E-mail désactivé — vérification non envoyée à {}", to);
			return;
		}
		if (to == null || to.isBlank()) {
			return;
		}
		try {
			String greeting = (firstName != null && !firstName.isBlank()) ? "Bonjour " + firstName.trim() + "," : "Bonjour,";
			SimpleMailMessage msg = new SimpleMailMessage();
			msg.setFrom(fromAddress);
			msg.setTo(to);
			msg.setSubject("BookVault — Confirmez votre adresse e-mail");
			msg.setText("""
					%s

					Bienvenue sur BookVault. Pour activer votre compte, confirmez votre adresse en cliquant sur le lien ci-dessous (valable 24 h) :

					%s

					Si vous n’avez pas créé de compte, ignorez ce message.

					L’équipe BookVault
					""".formatted(greeting, verifyUrl));
			mailSender.send(msg);
			log.info("E-mail de vérification envoyé à {}", to);
		}
		catch (Exception ex) {
			log.error("Échec envoi e-mail vérification à {} : {}", to, ex.getMessage());
		}
	}

	public void sendOrderConfirmation(
			String to,
			String firstName,
			long orderId,
			String totalLabel,
			String libraryUrl,
			java.util.List<String> bookLines) {
		if (!enabled) {
			log.debug("E-mail désactivé — confirmation commande #{} non envoyée à {}", orderId, to);
			return;
		}
		if (to == null || to.isBlank()) {
			log.warn("E-mail confirmation commande #{} ignoré : destinataire vide", orderId);
			return;
		}
		try {
			String greeting = (firstName != null && !firstName.isBlank())
					? "Bonjour " + firstName.trim() + ","
					: "Bonjour,";
			StringBuilder items = new StringBuilder();
			for (String line : bookLines) {
				items.append("  • ").append(line).append("\n");
			}
			SimpleMailMessage msg = new SimpleMailMessage();
			msg.setFrom(fromAddress);
			msg.setTo(to);
			msg.setSubject("BookVault — Commande confirmée #" + orderId);
			msg.setText("""
					%s

					Merci pour votre achat sur BookVault. Votre commande #%d a bien été enregistrée et payée.

					Montant : %s

					Articles :
					%s
					Accédez à vos livres dans votre bibliothèque :
					%s

					Vous pouvez lire ou télécharger chaque ouvrage depuis sa fiche livre (bouton Manuscrit).

					L'équipe BookVault
					""".formatted(greeting, orderId, totalLabel, items.toString(), libraryUrl));
			mailSender.send(msg);
			log.info("E-mail confirmation commande #{} envoyé à {}", orderId, to);
		}
		catch (Exception ex) {
			log.error("Échec envoi e-mail confirmation commande #{} à {} : {}", orderId, to, ex.getMessage());
		}
	}

	public void sendBookPublished(String to, String bookTitle, String publicationSheetUrl) {
		if (!enabled) {
			log.debug("E-mail désactivé — publication « {} » non envoyée à {}", bookTitle, to);
			return;
		}
		if (to == null || to.isBlank()) {
			log.warn("E-mail publication ignoré : destinataire vide pour « {} »", bookTitle);
			return;
		}
		try {
			SimpleMailMessage msg = new SimpleMailMessage();
			msg.setFrom(fromAddress);
			msg.setTo(to);
			msg.setSubject("BookVault — Votre livre est publié : " + bookTitle);
			msg.setText("""
					Bonjour,

					Bonne nouvelle : votre ouvrage « %s » a été validé et publié sur BookVault par l'équipe d'administration.

					Consultez votre fiche de publication :
					%s

					Vous pouvez aussi retrouver votre livre dans le catalogue public.

					L'équipe BookVault
					""".formatted(bookTitle, publicationSheetUrl));
			mailSender.send(msg);
			log.info("E-mail publication envoyé à {} pour « {} »", to, bookTitle);
		}
		catch (Exception ex) {
			log.error("Échec envoi e-mail publication à {} : {}", to, ex.getMessage());
		}
	}
}
