package com.intergiciel.community_service.web;

import com.intergiciel.community_service.service.CommunityFeedService;
import com.intergiciel.community_service.service.MemberSocialService;
import com.intergiciel.community_service.support.AuthSupport;
import com.intergiciel.community_service.web.dto.BookLikeRequest;
import com.intergiciel.community_service.web.dto.BuddyResponse;
import com.intergiciel.community_service.web.dto.EventResponse;
import com.intergiciel.community_service.web.dto.HubResponse;
import com.intergiciel.community_service.web.dto.LikeStatusResponse;
import com.intergiciel.community_service.web.dto.MemberResponse;
import com.intergiciel.community_service.web.dto.ThreadResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/community")
@Tag(name = "Communauté lecteur")
public class CommunityController {

	private final CommunityFeedService communityFeedService;
	private final MemberSocialService memberSocialService;

	public CommunityController(CommunityFeedService communityFeedService, MemberSocialService memberSocialService) {
		this.communityFeedService = communityFeedService;
		this.memberSocialService = memberSocialService;
	}

	@GetMapping("/hub")
	@Operation(summary = "Compteurs ambiance (hub)")
	public HubResponse hub() {
		return communityFeedService.hub();
	}

	@GetMapping("/threads")
	@Operation(summary = "Salons & discussions")
	public List<ThreadResponse> threads() {
		return communityFeedService.threads();
	}

	@GetMapping("/events")
	@Operation(summary = "Événements à venir")
	public List<EventResponse> events() {
		return communityFeedService.events();
	}

	@GetMapping("/buddies")
	@Operation(summary = "Suggestions « lecteurs comme vous »")
	public List<BuddyResponse> buddies(Authentication authentication) {
		return communityFeedService.buddies(AuthSupport.userId(authentication));
	}

	@GetMapping("/members/search")
	@Operation(summary = "Recherche de membres (email/prénom/nom)")
	public List<MemberResponse> searchMembers(@RequestParam(name = "q", required = false) String q,
			@RequestParam(name = "limit", defaultValue = "12") int limit) {
		return memberSocialService.searchMembers(q, limit);
	}

	@PostMapping("/likes")
	@Operation(summary = "Aimer un livre (sert de signal de recommandation)")
	public void likeBook(Authentication authentication, @Valid @RequestBody BookLikeRequest request) {
		memberSocialService.likeBook(AuthSupport.userId(authentication), request);
	}

	@GetMapping("/likes/{bookId}")
	@Operation(summary = "Statut: le lecteur a-t-il aimé ce livre ?")
	public LikeStatusResponse likeStatus(Authentication authentication, @PathVariable UUID bookId) {
		return new LikeStatusResponse(memberSocialService.isBookLiked(AuthSupport.userId(authentication), bookId));
	}

	@DeleteMapping("/likes/{bookId}")
	@Operation(summary = "Retirer le like d’un livre")
	public void unlike(Authentication authentication, @PathVariable UUID bookId) {
		memberSocialService.unlikeBook(AuthSupport.userId(authentication), bookId);
	}

	@GetMapping("/recommendations/buddies")
	@Operation(summary = "Lecteurs recommandés selon livres aimés en commun")
	public List<MemberResponse> recommendBuddies(Authentication authentication,
			@RequestParam(name = "limit", defaultValue = "6") int limit) {
		return memberSocialService.recommendBuddies(AuthSupport.userId(authentication), limit);
	}
}
