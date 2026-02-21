package com.campus.lostfound.repository;

import com.campus.lostfound.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByClaimIdOrderByCreatedAtAsc(Long claimId);
}
