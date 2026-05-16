package com.intergiciel.notification_service.service;

import com.intergiciel.notification_service.domain.BookSubscriptionEntity;
import com.intergiciel.notification_service.domain.BookSubscriptionId;
import com.intergiciel.notification_service.repository.BookSubscriptionRepository;
import com.intergiciel.notification_service.web.dto.BookSubscriptionItemResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class BookSubscriptionService {

	private final BookSubscriptionRepository repo;

	public BookSubscriptionService(BookSubscriptionRepository repo) {
		this.repo = repo;
	}

	@Transactional
	public void subscribe(UUID userId, UUID bookId) {
		BookSubscriptionId id = new BookSubscriptionId(userId, bookId);
		if (repo.existsById(id)) {
			return;
		}
		repo.save(new BookSubscriptionEntity(id, Instant.now()));
	}

	@Transactional
	public void unsubscribe(UUID userId, UUID bookId) {
		repo.deleteById(new BookSubscriptionId(userId, bookId));
	}

	@Transactional(readOnly = true)
	public boolean isSubscribed(UUID userId, UUID bookId) {
		return repo.existsById(new BookSubscriptionId(userId, bookId));
	}

	@Transactional(readOnly = true)
	public List<BookSubscriptionItemResponse> listForUser(UUID userId) {
		return repo.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
				.map(e -> new BookSubscriptionItemResponse(e.getId().getBookId(), e.getCreatedAt()))
				.toList();
	}
}

