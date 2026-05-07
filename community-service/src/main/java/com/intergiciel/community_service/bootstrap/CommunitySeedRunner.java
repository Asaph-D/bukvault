package com.intergiciel.community_service.bootstrap;

import com.intergiciel.community_service.domain.BuddySuggestionEntity;
import com.intergiciel.community_service.domain.ChatMessageEntity;
import com.intergiciel.community_service.domain.CommunityEventEntity;
import com.intergiciel.community_service.domain.CommunityThreadEntity;
import com.intergiciel.community_service.domain.ConversationEntity;
import com.intergiciel.community_service.domain.ConversationMemberEntity;
import com.intergiciel.community_service.domain.ConversationType;
import com.intergiciel.community_service.domain.HubStatEntity;
import com.intergiciel.community_service.repository.BuddySuggestionRepository;
import com.intergiciel.community_service.repository.ChatMessageRepository;
import com.intergiciel.community_service.repository.CommunityEventRepository;
import com.intergiciel.community_service.repository.CommunityThreadRepository;
import com.intergiciel.community_service.repository.ConversationMemberRepository;
import com.intergiciel.community_service.repository.ConversationRepository;
import com.intergiciel.community_service.repository.HubStatRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Component
@Order(20)
@Profile("!test")
@ConditionalOnProperty(name = "community.seed.enabled", havingValue = "true")
public class CommunitySeedRunner implements ApplicationRunner {

	private static final UUID USER_PAUL = UUID.fromString("30000000-0000-4000-a000-000000000001");
	private static final UUID ADMIN_KOUOKA = UUID.fromString("10000000-0000-4000-a000-000000000002");

	private static final UUID DEMO_CONV = UUID.fromString("c0000001-0000-4000-a000-000000000001");

	private final HubStatRepository hubStatRepository;
	private final CommunityThreadRepository threadRepository;
	private final CommunityEventRepository eventRepository;
	private final BuddySuggestionRepository buddyRepository;
	private final ConversationRepository conversationRepository;
	private final ConversationMemberRepository memberRepository;
	private final ChatMessageRepository chatMessageRepository;

	public CommunitySeedRunner(HubStatRepository hubStatRepository,
			CommunityThreadRepository threadRepository,
			CommunityEventRepository eventRepository,
			BuddySuggestionRepository buddyRepository,
			ConversationRepository conversationRepository,
			ConversationMemberRepository memberRepository,
			ChatMessageRepository chatMessageRepository) {
		this.hubStatRepository = hubStatRepository;
		this.threadRepository = threadRepository;
		this.eventRepository = eventRepository;
		this.buddyRepository = buddyRepository;
		this.conversationRepository = conversationRepository;
		this.memberRepository = memberRepository;
		this.chatMessageRepository = chatMessageRepository;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (hubStatRepository.existsById((short) 1)) {
			return;
		}

		HubStatEntity hub = new HubStatEntity();
		hub.setId((short) 1);
		hub.setActiveReaders(1240);
		hub.setOpenSalons(38);
		hub.setTagline("Les compteurs et flux sont alimentés par community-service — salons, événements et suggestions.");
		hubStatRepository.save(hub);

		saveThread(UUID.fromString("a1111111-1111-4111-a111-111111111101"),
				"Débat ouvert : fin de « Contes du Grassfield » — sans spoilers",
				"Littérature", 128, true, "Il y a 2 min", 0);
		saveThread(UUID.fromString("a1111111-1111-4111-a111-111111111102"),
				"Club : data science & territoires (mercredi 20h)",
				"Clubs", 42, false, "Il y a 14 min", 1);
		saveThread(UUID.fromString("a1111111-1111-4111-a111-111111111103"),
				"Atelier : structurer un essai documenté",
				"Ateliers", 89, true, "Il y a 1 h", 2);

		Instant now = Instant.now();
		saveEvent(UUID.fromString("b1111111-1111-4111-a111-111111111101"),
				"Dédicace virtuelle · J.-P. Mbarga", now.plus(1, ChronoUnit.DAYS), "Live", 0);
		saveEvent(UUID.fromString("b1111111-1111-4111-a111-111111111102"),
				"Salon readers — sciences & gestion", now.plus(3, ChronoUnit.DAYS), "Audio", 1);
		saveEvent(UUID.fromString("b1111111-1111-4111-a111-111111111103"),
				"Battle des premières phrases", now.plus(5, ChronoUnit.DAYS), "Jeu", 2);

		saveBuddy(UUID.fromString("d1111111-1111-4111-a111-111111111101"), USER_PAUL, "Marie",
				94, "Meridian — ch. 12", 0);
		saveBuddy(UUID.fromString("d1111111-1111-4111-a111-111111111102"), USER_PAUL, "Thomas",
				88, "Cartographie — ch. 4", 1);
		saveBuddy(UUID.fromString("d1111111-1111-4111-a111-111111111103"), USER_PAUL, "Lina",
				91, "Neige rouge", 2);

		Instant t0 = now.minus(2, ChronoUnit.HOURS);
		ConversationEntity conv = new ConversationEntity();
		conv.setId(DEMO_CONV);
		conv.setType(ConversationType.DIRECT);
		conv.setCreatedAt(t0);
		conv.setUpdatedAt(t0);
		conv.setLastMessagePreview("Merci pour votre retour sur le dernier chapitre !");
		conversationRepository.save(conv);
		memberRepository.save(new ConversationMemberEntity(DEMO_CONV, USER_PAUL));
		memberRepository.save(new ConversationMemberEntity(DEMO_CONV, ADMIN_KOUOKA));

		saveMsg(UUID.fromString("e1111111-1111-4111-a111-111111111101"), DEMO_CONV, USER_PAUL, t0,
				"Bonjour — petite question sur la fin du chapitre 3.");
		Instant lastAt = t0.plus(5, ChronoUnit.MINUTES);
		saveMsg(UUID.fromString("e1111111-1111-4111-a111-111111111102"), DEMO_CONV, ADMIN_KOUOKA,
				lastAt,
				"Merci pour votre retour sur le dernier chapitre !");
		ConversationEntity refreshed = conversationRepository.findById(DEMO_CONV).orElseThrow();
		refreshed.setUpdatedAt(lastAt);
		refreshed.setLastMessagePreview("Merci pour votre retour sur le dernier chapitre !");
		conversationRepository.save(refreshed);
	}

	private void saveThread(UUID id, String title, String channel, int users, boolean hot, String last, int sort) {
		CommunityThreadEntity t = new CommunityThreadEntity();
		t.setId(id);
		t.setTitle(title);
		t.setChannel(channel);
		t.setParticipantCount(users);
		t.setHot(hot);
		t.setLastActivityLabel(last);
		t.setSortIndex(sort);
		threadRepository.save(t);
	}

	private void saveEvent(UUID id, String title, Instant startsAt, String tag, int sort) {
		CommunityEventEntity e = new CommunityEventEntity();
		e.setId(id);
		e.setTitle(title);
		e.setStartsAt(startsAt);
		e.setTag(tag);
		e.setSortIndex(sort);
		eventRepository.save(e);
	}

	private void saveBuddy(UUID id, UUID viewer, String name, int match, String reading, int sort) {
		BuddySuggestionEntity b = new BuddySuggestionEntity();
		b.setId(id);
		b.setViewerUserId(viewer);
		b.setDisplayName(name);
		b.setMatchPercent(match);
		b.setReadingHint(reading);
		b.setSortIndex(sort);
		buddyRepository.save(b);
	}

	private void saveMsg(UUID id, UUID convId, UUID sender, Instant at, String content) {
		ChatMessageEntity m = new ChatMessageEntity();
		m.setId(id);
		m.setConversationId(convId);
		m.setSenderId(sender);
		m.setCreatedAt(at);
		m.setContent(content);
		chatMessageRepository.save(m);
	}
}
