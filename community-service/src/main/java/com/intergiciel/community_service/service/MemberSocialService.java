package com.intergiciel.community_service.service;

import com.intergiciel.community_service.domain.BookLikeEntity;
import com.intergiciel.community_service.domain.BookLikeId;
import com.intergiciel.community_service.domain.MemberProfileEntity;
import com.intergiciel.community_service.repository.BookLikeRepository;
import com.intergiciel.community_service.repository.MemberProfileRepository;
import com.intergiciel.community_service.web.dto.BookLikeRequest;
import com.intergiciel.community_service.web.dto.MemberResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class MemberSocialService {

	private final MemberProfileRepository memberProfileRepository;
	private final BookLikeRepository bookLikeRepository;

	public MemberSocialService(MemberProfileRepository memberProfileRepository, BookLikeRepository bookLikeRepository) {
		this.memberProfileRepository = memberProfileRepository;
		this.bookLikeRepository = bookLikeRepository;
	}

	@Transactional(readOnly = true)
	public List<MemberResponse> searchMembers(String q, int limit) {
		if (q == null || q.trim().length() < 2) {
			return List.of();
		}
		String query = q.trim();
		return memberProfileRepository.search(query, PageRequest.of(0, Math.max(1, Math.min(50, limit)))).stream()
				.map(MemberSocialService::toMember)
				.toList();
	}

	@Transactional
	public void likeBook(UUID userId, BookLikeRequest request) {
		BookLikeId id = new BookLikeId(userId, request.bookId());
		if (bookLikeRepository.existsById(id)) {
			return;
		}
		bookLikeRepository.save(new BookLikeEntity(id, Instant.now()));
	}

	@Transactional(readOnly = true)
	public boolean isBookLiked(UUID userId, UUID bookId) {
		return bookLikeRepository.existsById(new BookLikeId(userId, bookId));
	}

	@Transactional
	public void unlikeBook(UUID userId, UUID bookId) {
		bookLikeRepository.deleteById(new BookLikeId(userId, bookId));
	}

	@Transactional(readOnly = true)
	public List<MemberResponse> recommendBuddies(UUID userId, int limit) {
		List<UUID> userIds = bookLikeRepository.recommendBuddies(userId, PageRequest.of(0, Math.max(1, Math.min(50, limit))));
		if (userIds.isEmpty()) {
			return List.of();
		}
		// Keep order from query
		var map = memberProfileRepository.findAllById(userIds).stream()
				.collect(java.util.stream.Collectors.toMap(MemberProfileEntity::getUserId, m -> m));
		return userIds.stream()
				.map(map::get)
				.filter(java.util.Objects::nonNull)
				.map(MemberSocialService::toMember)
				.toList();
	}

	private static MemberResponse toMember(MemberProfileEntity m) {
		return new MemberResponse(
				m.getUserId(),
				m.getEmail(),
				(m.getFirstName() + " " + m.getLastName()).trim(),
				m.getRole(),
				m.getBio());
	}
}

