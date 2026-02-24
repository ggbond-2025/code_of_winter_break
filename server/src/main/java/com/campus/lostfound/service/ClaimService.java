package com.campus.lostfound.service;

import com.campus.lostfound.model.ChatMessage;
import com.campus.lostfound.model.ClaimRecord;

import java.util.List;

public interface ClaimService {

    ClaimRecord create(Long userId, Long itemId, String message, String proof, String imageUrls);

    List<ClaimRecord> myClaims(Long userId);

    List<ClaimRecord> claimsForItem(Long userId, String role, Long itemId);

    List<ClaimRecord> listPendingClaims();

    ClaimRecord getMyClaimForItem(Long userId, Long itemId);

    ClaimRecord review(Long userId, String role, Long claimId, String status, String reason);

    List<ClaimRecord> myMatchedChats(Long userId);

    ClaimRecord getClaimDetail(Long userId, Long claimId);

    List<ClaimRecord> adminHistoryClaims(String location, String keyword, Integer days);

    ChatMessage sendMessage(Long userId, Long claimId, Long peerId, String content);

    List<ChatMessage> getMessages(Long userId, Long claimId, Long peerId);
}
