package com.campus.lostfound.repository;

import com.campus.lostfound.model.ClaimRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClaimRecordRepository extends JpaRepository<ClaimRecord, Long> {
    List<ClaimRecord> findByClaimerIdOrderByCreatedAtDesc(Long claimerId);
    List<ClaimRecord> findByItemIdOrderByCreatedAtDesc(Long itemId);
    ClaimRecord findTopByItemIdAndClaimerIdOrderByCreatedAtDesc(Long itemId, Long claimerId);
    List<ClaimRecord> findByStatusOrderByCreatedAtDesc(String status);
    List<ClaimRecord> findByReviewerIdOrderByCreatedAtDesc(Long reviewerId);
        @Query("""
                        select c from ClaimRecord c
                        where c.status = 'APPROVED'
                            and c.item is not null
                            and c.item.status <> 'ARCHIVED'
                            and (
                                c.claimer.id = :userId
                                or (c.reviewer is not null and c.reviewer.id = :userId)
                                or c.item.creator.id = :userId
                            )
                        order by c.createdAt desc
                        """)
        List<ClaimRecord> findApprovedChatClaimsForUser(@Param("userId") Long userId);
    long countByStatus(String status);
    long countByItemId(Long itemId);
    void deleteByItemId(Long itemId);
}
