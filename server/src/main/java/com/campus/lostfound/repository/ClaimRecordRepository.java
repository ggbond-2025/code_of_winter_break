package com.campus.lostfound.repository;

import com.campus.lostfound.model.ClaimRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClaimRecordRepository extends JpaRepository<ClaimRecord, Long> {
    List<ClaimRecord> findByClaimerIdOrderByCreatedAtDesc(Long claimerId);
    List<ClaimRecord> findByItemIdOrderByCreatedAtDesc(Long itemId);
    ClaimRecord findTopByItemIdAndClaimerIdOrderByCreatedAtDesc(Long itemId, Long claimerId);
    List<ClaimRecord> findByStatusOrderByCreatedAtDesc(String status);
    List<ClaimRecord> findByReviewerIdOrderByCreatedAtDesc(Long reviewerId);
    long countByStatus(String status);
    long countByItemId(Long itemId);
}
